#!/usr/bin/env python3
"""Plan and create task worktrees from workspace JSON config."""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Any


DEFAULT_PATH_TEMPLATE = "~/.agent-work/workspaces/{{ TASKSLUG }}/{{ REPOBASENAME }}"
DEFAULT_BRANCH_TEMPLATE = "{{ TASKSLUG }}"
DEFAULT_CONFIG: dict[str, Any] = {
    "disabled": False,
    "pathTemplate": DEFAULT_PATH_TEMPLATE,
    "branchTemplate": DEFAULT_BRANCH_TEMPLATE,
    "repos": [
        {
            "localPath": ".",
            "description": "Selected repository",
            "sourceRef": "HEAD",
            "setupCommand": "",
            "copyGlobs": [
                ".env*",
                ".agent-work/workspace.local.json",
            ],
            "primary": True,
        }
    ],
}
SCALAR_DEFAULTS = {
    "disabled": False,
    "pathTemplate": DEFAULT_PATH_TEMPLATE,
    "branchTemplate": DEFAULT_BRANCH_TEMPLATE,
    "sourceRef": "HEAD",
    "setupCommand": "",
}
ROOT_SCALARS = set(SCALAR_DEFAULTS)
REPO_FIELDS = {
    "localPath",
    "description",
    "sourceRef",
    "setupCommand",
    "copyGlobs",
    "primary",
    "$patch",
}
TEMPLATE_RE = re.compile(r"{{\s*([A-Z_]+)\s*}}")


class SetupError(RuntimeError):
    """A user-actionable configuration or workspace error."""


def run(
    command: list[str],
    *,
    cwd: Path | None = None,
    check: bool = True,
) -> subprocess.CompletedProcess[str]:
    result = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    if check and result.returncode:
        detail = result.stderr.strip() or result.stdout.strip() or "command failed"
        raise SetupError(f"{' '.join(command)}: {detail}")
    return result


def git(repo: Path, *args: str, check: bool = True) -> str:
    return run(["git", "-C", str(repo), *args], check=check).stdout.strip()


def git_root(path: Path) -> Path:
    return Path(git(path, "rev-parse", "--show-toplevel")).resolve()


def git_common_dir(path: Path) -> Path:
    raw = Path(git(path, "rev-parse", "--git-common-dir"))
    return (path / raw).resolve() if not raw.is_absolute() else raw.resolve()


def load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text())
    except json.JSONDecodeError as error:
        raise SetupError(
            f"{path}: invalid JSON at line {error.lineno}, column {error.colno}: {error.msg}"
        ) from error
    if not isinstance(value, dict):
        raise SetupError(f"{path}: root must be a JSON object")
    return value


def require_string(value: Any, location: str, *, allow_empty: bool = False) -> str:
    if not isinstance(value, str) or (not allow_empty and not value.strip()):
        qualifier = "string" if allow_empty else "non-empty string"
        raise SetupError(f"{location}: expected {qualifier}")
    return value


def require_string_list(value: Any, location: str) -> list[str]:
    if not isinstance(value, list) or any(not isinstance(item, str) for item in value):
        raise SetupError(f"{location}: expected an array of strings")
    return list(value)


def dedupe(items: list[str]) -> list[str]:
    return list(dict.fromkeys(items))


def validate_repo_entry(entry: Any, location: str, *, local: bool) -> dict[str, Any]:
    if not isinstance(entry, dict):
        raise SetupError(f"{location}: expected an object")
    unknown = sorted(set(entry) - REPO_FIELDS)
    if unknown:
        raise SetupError(f"{location}: unsupported fields: {', '.join(unknown)}")
    local_path = require_string(entry.get("localPath"), f"{location}.localPath")
    if "$patch" in entry:
        if not local or entry["$patch"] != "delete":
            raise SetupError(f"{location}.$patch: only local config supports 'delete'")
    for field in ("description", "sourceRef"):
        if field in entry:
            require_string(entry[field], f"{location}.{field}")
    if "setupCommand" in entry:
        require_string(entry["setupCommand"], f"{location}.setupCommand", allow_empty=True)
    if "copyGlobs" in entry:
        require_string_list(entry["copyGlobs"], f"{location}.copyGlobs")
    if "primary" in entry and not isinstance(entry["primary"], bool):
        raise SetupError(f"{location}.primary: expected a boolean")
    result = dict(entry)
    result["localPath"] = local_path
    return result


def validate_root_fields(config: dict[str, Any], location: str, *, local: bool) -> None:
    unknown = sorted(set(config) - ROOT_SCALARS - {"copyGlobs", "repos", "$patch"})
    if unknown:
        raise SetupError(f"{location}: unsupported fields: {', '.join(unknown)}")
    if "$patch" in config:
        raise SetupError(f"{location}.$patch: root patches are unsupported")
    if "disabled" in config and not isinstance(config["disabled"], bool):
        raise SetupError(f"{location}.disabled: expected a boolean")
    for field in ("pathTemplate", "branchTemplate", "sourceRef"):
        if field in config:
            require_string(config[field], f"{location}.{field}")
    if "setupCommand" in config:
        require_string(config["setupCommand"], f"{location}.setupCommand", allow_empty=True)
    if "copyGlobs" in config:
        require_string_list(config["copyGlobs"], f"{location}.copyGlobs")
    if "repos" in config and not isinstance(config["repos"], list):
        raise SetupError(f"{location}.repos: expected an array")
    if not local:
        for index, entry in enumerate(config.get("repos", [])):
            if isinstance(entry, dict) and "$patch" in entry:
                raise SetupError(f"{location}.repos[{index}].$patch: allowed only in local config")


def merge_config(repo_root: Path) -> dict[str, Any]:
    shared_path = repo_root / ".agent-work" / "workspace.json"
    local_path = repo_root / ".agent-work" / "workspace.local.json"
    if not shared_path.exists() and not local_path.exists():
        raise SetupError("no workspace config found; run the init subcommand first")

    shared = load_json(shared_path) if shared_path.exists() else {}
    local = load_json(local_path) if local_path.exists() else {}
    validate_root_fields(shared, str(shared_path), local=False)
    validate_root_fields(local, str(local_path), local=True)

    effective: dict[str, Any] = {}
    for field, default in SCALAR_DEFAULTS.items():
        effective[field] = local.get(field, shared.get(field, default))
    effective["disabledSource"] = (
        str(local_path)
        if "disabled" in local
        else str(shared_path)
        if "disabled" in shared
        else "built-in default"
    )

    root_globs = dedupe(
        require_string_list(shared.get("copyGlobs", []), f"{shared_path}.copyGlobs")
        + require_string_list(local.get("copyGlobs", []), f"{local_path}.copyGlobs")
    )

    raw_shared_repos = shared.get("repos", DEFAULT_CONFIG["repos"])
    if not isinstance(raw_shared_repos, list):
        raise SetupError(f"{shared_path}.repos: expected an array")
    repos: list[dict[str, Any]] = []
    for index, raw in enumerate(raw_shared_repos):
        repos.append(validate_repo_entry(raw, f"{shared_path}.repos[{index}]", local=False))

    seen_shared: set[str] = set()
    for repo in repos:
        key = repo["localPath"]
        if key in seen_shared:
            raise SetupError(f"{shared_path}.repos: duplicate localPath {key!r}")
        seen_shared.add(key)

    seen_local: set[str] = set()
    for index, raw in enumerate(local.get("repos", [])):
        override = validate_repo_entry(raw, f"{local_path}.repos[{index}]", local=True)
        key = override["localPath"]
        if key in seen_local:
            raise SetupError(f"{local_path}.repos: duplicate localPath {key!r}")
        seen_local.add(key)
        match = next((i for i, item in enumerate(repos) if item["localPath"] == key), None)
        if override.get("$patch") == "delete":
            if match is not None:
                repos.pop(match)
            continue
        override.pop("$patch", None)
        if match is None:
            repos.append(override)
        else:
            base = repos[match]
            combined_globs = dedupe(
                require_string_list(base.get("copyGlobs", []), f"repo {key}.copyGlobs")
                + require_string_list(override.get("copyGlobs", []), f"local repo {key}.copyGlobs")
            )
            merged = {**base, **override}
            if combined_globs:
                merged["copyGlobs"] = combined_globs
            repos[match] = merged

    if not repos:
        raise SetupError("effective config has no repositories")

    effective_repos: list[dict[str, Any]] = []
    for index, repo in enumerate(repos):
        item = dict(repo)
        item["sourceRef"] = repo.get("sourceRef", effective["sourceRef"])
        item["setupCommand"] = repo.get("setupCommand", effective["setupCommand"])
        item["copyGlobs"] = dedupe(root_globs + list(repo.get("copyGlobs", [])))
        effective_repos.append(item)

    primary_indexes = [i for i, repo in enumerate(effective_repos) if repo.get("primary") is True]
    if len(primary_indexes) > 1:
        raise SetupError("effective config marks more than one repository primary")
    if not primary_indexes:
        dot_indexes = [i for i, repo in enumerate(effective_repos) if repo["localPath"] == "."]
        if len(effective_repos) == 1:
            primary_indexes = [0]
        elif len(dot_indexes) == 1:
            primary_indexes = dot_indexes
        else:
            raise SetupError("multi-repository config needs exactly one primary repository")
    for index, repo in enumerate(effective_repos):
        repo["primary"] = index == primary_indexes[0]

    effective["copyGlobs"] = root_globs
    effective["repos"] = effective_repos
    effective["configFiles"] = [str(path) for path in (shared_path, local_path) if path.exists()]
    return effective


def render_template(template: str, task_slug: str, repo_basename: str, location: str) -> str:
    names = TEMPLATE_RE.findall(template)
    unsupported = sorted(set(names) - {"TASKSLUG", "REPOBASENAME"})
    if unsupported:
        raise SetupError(f"{location}: unsupported template variables: {', '.join(unsupported)}")
    rendered = TEMPLATE_RE.sub(
        lambda match: task_slug if match.group(1) == "TASKSLUG" else repo_basename,
        template,
    )
    if "{{" in rendered or "}}" in rendered:
        raise SetupError(f"{location}: malformed template expression")
    return rendered


def parse_worktrees(repo: Path) -> list[dict[str, str]]:
    output = git(repo, "worktree", "list", "--porcelain")
    records: list[dict[str, str]] = []
    for block in output.split("\n\n"):
        record: dict[str, str] = {}
        for line in block.splitlines():
            key, _, value = line.partition(" ")
            record[key] = value
        if "worktree" in record:
            records.append(record)
    return records


def is_relative_to(path: Path, parent: Path) -> bool:
    try:
        path.relative_to(parent)
        return True
    except ValueError:
        return False


def validate_copy_pattern(pattern: str, location: str) -> None:
    if not pattern:
        raise SetupError(f"{location}: copy glob cannot be empty")
    candidate = Path(pattern)
    if candidate.is_absolute() or ".." in candidate.parts:
        raise SetupError(f"{location}: copy glob must stay relative to the repository")
    if ".git" in candidate.parts:
        raise SetupError(f"{location}: Git metadata cannot be copied")


def resolve_copy_matches(repo: Path, patterns: list[str], destination: Path) -> tuple[list[str], list[str]]:
    matches: list[str] = []
    unmatched: list[str] = []
    for index, pattern in enumerate(patterns):
        validate_copy_pattern(pattern, f"copyGlobs[{index}]")
        found = glob.glob(str(repo / pattern), recursive=True)
        accepted = 0
        for raw in found:
            source = Path(raw)
            resolved = source.resolve()
            if not is_relative_to(resolved, repo):
                raise SetupError(f"copy match escapes repository: {source}")
            relative = source.relative_to(repo)
            if relative == Path(".") or ".git" in relative.parts:
                raise SetupError(f"copy match includes Git metadata: {source}")
            if source.is_dir() and is_relative_to(destination, resolved):
                raise SetupError(f"copy directory contains destination worktree: {source}")
            matches.append(relative.as_posix())
            accepted += 1
        if not accepted:
            unmatched.append(pattern)
    return dedupe(matches), unmatched


def verify_branch_name(repo: Path, branch: str) -> None:
    result = run(["git", "-C", str(repo), "check-ref-format", "--branch", branch], check=False)
    if result.returncode:
        raise SetupError(f"invalid rendered branch {branch!r}: {result.stderr.strip()}")


def make_plan(repo_root: Path, task_slug: str) -> dict[str, Any]:
    selected_root = git_root(repo_root)
    config = merge_config(selected_root)
    if config["disabled"]:
        raise SetupError(
            f"workspace setup is disabled by {config['disabledSource']}; use the branch subcommand"
        )

    plans: list[dict[str, Any]] = []
    seen_common_dirs: set[Path] = set()
    seen_destinations: set[Path] = set()
    for index, repo_config in enumerate(config["repos"]):
        configured_path = (selected_root / repo_config["localPath"]).resolve()
        if not configured_path.exists():
            raise SetupError(f"repos[{index}].localPath does not exist: {configured_path}")
        source_root = git_root(configured_path)
        common_dir = git_common_dir(source_root)
        if common_dir in seen_common_dirs:
            raise SetupError(f"repos[{index}] resolves to a duplicate Git repository: {source_root}")
        seen_common_dirs.add(common_dir)

        branch = render_template(
            config["branchTemplate"], task_slug, source_root.name, "branchTemplate"
        )
        verify_branch_name(source_root, branch)
        rendered_path = render_template(
            config["pathTemplate"], task_slug, source_root.name, "pathTemplate"
        )
        expanded = Path(rendered_path).expanduser()
        destination = (selected_root / expanded).resolve() if not expanded.is_absolute() else expanded.resolve()
        if destination in seen_destinations:
            raise SetupError(f"repos[{index}] renders a duplicate destination: {destination}")
        seen_destinations.add(destination)

        worktrees = parse_worktrees(source_root)
        destination_record = next(
            (item for item in worktrees if Path(item["worktree"]).resolve() == destination), None
        )
        branch_ref = f"refs/heads/{branch}"
        branch_record = next((item for item in worktrees if item.get("branch") == branch_ref), None)
        branch_exists = (
            run(
                ["git", "-C", str(source_root), "show-ref", "--verify", "--quiet", branch_ref],
                check=False,
            ).returncode
            == 0
        )

        if destination_record:
            if not os.path.lexists(destination):
                raise SetupError(
                    f"destination is registered but missing on disk: {destination}; repair or prune it first"
                )
            if destination_record.get("branch") != branch_ref:
                actual = destination_record.get("branch", "detached HEAD")
                raise SetupError(f"destination {destination} is registered on {actual}, not {branch_ref}")
            action = "reuse"
        elif os.path.lexists(destination):
            raise SetupError(f"destination exists but is not the intended registered worktree: {destination}")
        elif branch_record:
            raise SetupError(f"branch {branch!r} is already checked out at {branch_record['worktree']}")
        elif branch_exists:
            action = "attach"
        else:
            action = "create"

        source_ref = repo_config["sourceRef"]
        source_result = run(
            ["git", "-C", str(source_root), "rev-parse", "--verify", f"{source_ref}^{{commit}}"],
            check=False,
        )
        source_commit = source_result.stdout.strip() if source_result.returncode == 0 else None
        if action == "create" and source_commit is None:
            detail = source_result.stderr.strip() or "ref does not resolve to a commit"
            raise SetupError(f"sourceRef {source_ref!r} for {source_root} is unavailable: {detail}")

        copy_matches, unmatched = resolve_copy_matches(
            source_root, repo_config["copyGlobs"], destination
        )
        plans.append(
            {
                "index": index,
                "description": repo_config.get("description", source_root.name),
                "sourceRepo": str(source_root),
                "commonGitDir": str(common_dir),
                "sourceRef": source_ref,
                "sourceCommit": source_commit,
                "branch": branch,
                "destination": str(destination),
                "action": action,
                "createsBranch": action == "create",
                "createsWorktree": action in {"create", "attach"},
                "copyGlobs": repo_config["copyGlobs"],
                "copyMatches": copy_matches,
                "unmatchedGlobs": unmatched,
                "setupCommand": repo_config["setupCommand"],
                "primary": repo_config["primary"],
            }
        )

    primary = next(item for item in plans if item["primary"])
    return {
        "status": "planned",
        "taskSlug": task_slug,
        "selectedRepo": str(selected_root),
        "configFiles": config["configFiles"],
        "primaryWorktree": primary["destination"],
        "repositories": plans,
    }


def remove_for_copy(destination: Path) -> None:
    if destination.is_symlink() or destination.is_file():
        destination.unlink()
    elif destination.exists():
        shutil.rmtree(destination)


def copy_match(source_root: Path, destination_root: Path, relative: str) -> None:
    source = source_root / relative
    destination = destination_root / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    resolved_root = destination_root.resolve()
    if not is_relative_to(destination.parent.resolve(), resolved_root):
        raise SetupError(f"copy target parent escapes worktree through a symlink: {destination}")
    if source.is_symlink():
        remove_for_copy(destination)
        destination.symlink_to(os.readlink(source), target_is_directory=source.is_dir())
    elif source.is_dir():
        if destination.is_symlink() or (destination.exists() and not destination.is_dir()):
            remove_for_copy(destination)
        shutil.copytree(source, destination, symlinks=True, dirs_exist_ok=True)
    elif source.is_file():
        if destination.is_symlink():
            destination.unlink()
        if destination.exists() and destination.is_dir():
            raise SetupError(f"copy target is a directory: {destination}")
        shutil.copy2(source, destination)
    else:
        raise SetupError(f"copy source disappeared after planning: {source}")


def verify_worktree(item: dict[str, Any]) -> dict[str, str]:
    destination = Path(item["destination"])
    source = Path(item["sourceRepo"])
    actual_root = git_root(destination)
    actual_branch = git(destination, "branch", "--show-current")
    if actual_root != destination.resolve():
        raise SetupError(f"verification root mismatch: expected {destination}, got {actual_root}")
    if actual_branch != item["branch"]:
        raise SetupError(
            f"verification branch mismatch at {destination}: expected {item['branch']}, got {actual_branch or 'detached HEAD'}"
        )
    if git_common_dir(destination) != git_common_dir(source):
        raise SetupError(f"verification repository mismatch at {destination}")
    return {
        "root": str(actual_root),
        "branch": actual_branch,
        "head": git(destination, "rev-parse", "HEAD"),
    }


def apply_plan(plan: dict[str, Any]) -> dict[str, Any]:
    result = {**plan, "status": "applying", "repositories": []}
    for planned in plan["repositories"]:
        record = {
            **planned,
            "status": "pending",
            "branchCreated": False,
            "worktreeCreated": False,
            "copied": [],
            "setupResult": "pending",
        }
        result["repositories"].append(record)
        source = Path(record["sourceRepo"])
        destination = Path(record["destination"])
        try:
            record["status"] = "creating-worktree"
            if record["action"] == "create":
                git(
                    source,
                    "worktree",
                    "add",
                    "-b",
                    record["branch"],
                    str(destination),
                    record["sourceCommit"],
                )
                record["branchCreated"] = True
                record["worktreeCreated"] = True
            elif record["action"] == "attach":
                git(source, "worktree", "add", str(destination), record["branch"])
                record["worktreeCreated"] = True

            record["status"] = "copying"
            for relative in record["copyMatches"]:
                copy_match(source, destination, relative)
                record["copied"].append(relative)

            command = record["setupCommand"]
            if command:
                record["status"] = "running-setup"
                shell = os.environ.get("SHELL", "/bin/sh")
                setup = subprocess.run(
                    command,
                    cwd=destination,
                    shell=True,
                    executable=shell,
                    stdout=sys.stderr,
                    stderr=sys.stderr,
                )
                if setup.returncode:
                    record["setupResult"] = f"failed ({setup.returncode})"
                    raise SetupError(f"setup command exited with status {setup.returncode}: {command}")
                record["setupResult"] = "succeeded"
            else:
                record["setupResult"] = "skipped"

            record["status"] = "verifying"
            record["verification"] = verify_worktree(record)
            record["status"] = "ready"
        except Exception as error:
            failed_operation = record["status"]
            try:
                branch_ref = f"refs/heads/{record['branch']}"
                branch_exists = (
                    run(
                        ["git", "-C", str(source), "show-ref", "--verify", "--quiet", branch_ref],
                        check=False,
                    ).returncode
                    == 0
                )
                if record["action"] == "create" and branch_exists:
                    record["branchCreated"] = True
                registered = any(
                    Path(item["worktree"]).resolve() == destination
                    for item in parse_worktrees(source)
                )
                record["worktreeCreated"] = record["worktreeCreated"] or registered
                if registered and destination.exists():
                    record["verification"] = verify_worktree(record)
            except Exception as verification_error:
                record["verificationError"] = str(verification_error)
            record["status"] = "failed"
            record["failedOperation"] = failed_operation
            record["error"] = str(error)
            result["status"] = "partial"
            result["error"] = str(error)
            return result
    result["status"] = "ready"
    return result


def branch_plan(repo_root: Path, task_slug: str, apply: bool) -> dict[str, Any]:
    selected_root = git_root(repo_root)
    config = merge_config(selected_root)
    dot_repo = next((item for item in config["repos"] if item["localPath"] == "."), None)
    source_ref = dot_repo["sourceRef"] if dot_repo else config["sourceRef"]
    branch = render_template(config["branchTemplate"], task_slug, selected_root.name, "branchTemplate")
    verify_branch_name(selected_root, branch)
    current = git(selected_root, "branch", "--show-current")
    branch_ref = f"refs/heads/{branch}"
    checked_out = next(
        (item for item in parse_worktrees(selected_root) if item.get("branch") == branch_ref), None
    )
    exists = (
        run(
            ["git", "-C", str(selected_root), "show-ref", "--verify", "--quiet", branch_ref],
            check=False,
        ).returncode
        == 0
    )
    source_commit: str | None = None
    if current == branch:
        action = "reuse"
    elif checked_out:
        raise SetupError(f"branch {branch!r} is already checked out at {checked_out['worktree']}")
    elif exists:
        action = "switch"
    else:
        source_commit = git(selected_root, "rev-parse", "--verify", f"{source_ref}^{{commit}}")
        action = "create"

    result: dict[str, Any] = {
        "status": "planned",
        "repo": str(selected_root),
        "taskSlug": task_slug,
        "branch": branch,
        "sourceRef": source_ref,
        "sourceCommit": source_commit if action == "create" else None,
        "action": action,
        "disabled": config["disabled"],
        "disabledSource": config["disabledSource"],
    }
    if apply and action == "switch":
        git(selected_root, "switch", branch)
    elif apply and action == "create":
        git(selected_root, "switch", "-c", branch, source_commit)
    if apply:
        actual = git(selected_root, "branch", "--show-current")
        if actual != branch:
            raise SetupError(f"branch verification failed: expected {branch}, got {actual}")
        result["status"] = "ready"
        result["head"] = git(selected_root, "rev-parse", "HEAD")
    return result


def init_config(repo_root: Path, write: bool) -> dict[str, Any]:
    selected_root = git_root(repo_root)
    destination = selected_root / ".agent-work" / "workspace.json"
    local = selected_root / ".agent-work" / "workspace.local.json"
    if destination.exists() or local.exists():
        raise SetupError("workspace config already exists")
    if write:
        destination.parent.mkdir(parents=True, exist_ok=True)
        try:
            with destination.open("x") as handle:
                json.dump(DEFAULT_CONFIG, handle, indent=2)
                handle.write("\n")
        except FileExistsError as error:
            raise SetupError(f"workspace config appeared during initialization: {destination}") from error
    return {
        "status": "written" if write else "planned",
        "path": str(destination),
        "config": DEFAULT_CONFIG,
    }


def emit(value: dict[str, Any], *, stream: Any = sys.stdout) -> None:
    json.dump(value, stream, indent=2)
    stream.write("\n")


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    init = subparsers.add_parser("init", help="print or write the preserved default config")
    init.add_argument("--repo-root", required=True, type=Path)
    init.add_argument("--write", action="store_true")

    for name in ("plan", "apply"):
        command = subparsers.add_parser(name, help=f"{name} the configured workspace")
        command.add_argument("--repo-root", required=True, type=Path)
        command.add_argument("--task-slug", required=True)

    branch = subparsers.add_parser("branch", help="plan or apply disabled-workspace checkout")
    branch.add_argument("--repo-root", required=True, type=Path)
    branch.add_argument("--task-slug", required=True)
    branch.add_argument("--apply", action="store_true")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])
    try:
        if args.command == "init":
            result = init_config(args.repo_root, args.write)
        elif args.command == "branch":
            result = branch_plan(args.repo_root, args.task_slug, args.apply)
        else:
            plan = make_plan(args.repo_root, args.task_slug)
            result = apply_plan(plan) if args.command == "apply" else plan
        emit(result)
        return 0 if result.get("status") not in {"partial", "error"} else 1
    except (OSError, SetupError) as error:
        emit({"status": "error", "error": str(error)}, stream=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
