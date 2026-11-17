from __future__ import annotations

import importlib.util
import json
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "scripts" / "setup_worktree.py"
SPEC = importlib.util.spec_from_file_location("setup_worktree", SCRIPT)
assert SPEC and SPEC.loader
setup_worktree = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(setup_worktree)


def command(*args: str, cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, cwd=cwd, text=True, capture_output=True, check=check)


def initialize_repo(path: Path) -> None:
    path.mkdir(parents=True)
    command("git", "init", "-q", cwd=path)
    command("git", "config", "user.name", "Skill Test", cwd=path)
    command("git", "config", "user.email", "skill-test@example.invalid", cwd=path)
    (path / "README.md").write_text("fixture\n")
    command("git", "add", "README.md", cwd=path)
    command("git", "commit", "-qm", "fixture", cwd=path)


class SetupWorktreeTests(unittest.TestCase):
    def setUp(self) -> None:
        if shutil.which("git") is None:
            self.skipTest("git is required")
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        self.repo = self.root / "project"
        initialize_repo(self.repo)

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_config(self, value: dict, *, local: bool = False) -> Path:
        directory = self.repo / ".agent-work"
        directory.mkdir(exist_ok=True)
        name = "workspace.local.json" if local else "workspace.json"
        path = directory / name
        path.write_text(json.dumps(value))
        return path

    def run_helper(self, *args: str, check: bool = True) -> subprocess.CompletedProcess[str]:
        return command(
            "python3",
            str(SCRIPT),
            *args,
            "--repo-root",
            str(self.repo),
            check=check,
        )

    def test_init_writes_preserved_default(self) -> None:
        result = self.run_helper("init", "--write")
        payload = json.loads(result.stdout)
        config = json.loads((self.repo / ".agent-work/workspace.json").read_text())
        self.assertEqual(payload["status"], "written")
        self.assertEqual(config, setup_worktree.DEFAULT_CONFIG)

    def test_local_merge_is_additive_and_can_reenable(self) -> None:
        self.write_config(
            {
                "disabled": True,
                "copyGlobs": ["shared-root"],
                "repos": [{"localPath": ".", "copyGlobs": ["shared-repo"]}],
            }
        )
        self.write_config(
            {
                "disabled": False,
                "copyGlobs": ["local-root", "shared-root"],
                "repos": [
                    {
                        "localPath": ".",
                        "copyGlobs": ["local-repo", "shared-repo"],
                        "setupCommand": "true",
                    }
                ],
            },
            local=True,
        )
        effective = setup_worktree.merge_config(self.repo)
        self.assertFalse(effective["disabled"])
        self.assertEqual(
            effective["repos"][0]["copyGlobs"],
            ["shared-root", "local-root", "shared-repo", "local-repo"],
        )
        self.assertEqual(effective["repos"][0]["setupCommand"], "true")

    def test_local_overlay_rejects_duplicate_paths(self) -> None:
        self.write_config({"repos": [{"localPath": ".", "primary": True}]})
        self.write_config(
            {
                "repos": [
                    {"localPath": ".", "setupCommand": "true"},
                    {"localPath": ".", "copyGlobs": [".env.local"]},
                ]
            },
            local=True,
        )
        with self.assertRaisesRegex(setup_worktree.SetupError, "duplicate localPath"):
            setup_worktree.merge_config(self.repo)

    def test_plan_apply_and_reuse_are_resumable(self) -> None:
        destination_template = str(self.root / "workspaces" / "{{ TASKSLUG }}" / "{{ REPOBASENAME }}")
        self.write_config(
            {
                "pathTemplate": destination_template,
                "branchTemplate": "task/{{ TASKSLUG }}",
                "sourceRef": "HEAD",
                "setupCommand": "printf ready > setup.marker",
                "repos": [
                    {
                        "localPath": ".",
                        "copyGlobs": [".env.local"],
                        "primary": True,
                    }
                ],
            }
        )
        (self.repo / ".env.local").write_text("TOKEN=fixture\n")

        plan = json.loads(
            self.run_helper("plan", "--task-slug", "demo").stdout
        )
        self.assertEqual(plan["repositories"][0]["action"], "create")

        first = json.loads(
            self.run_helper("apply", "--task-slug", "demo").stdout
        )
        destination = Path(first["primaryWorktree"])
        self.assertEqual(first["status"], "ready")
        self.assertEqual((destination / ".env.local").read_text(), "TOKEN=fixture\n")
        self.assertEqual((destination / "setup.marker").read_text(), "ready")
        self.assertEqual(command("git", "branch", "--show-current", cwd=destination).stdout.strip(), "task/demo")

        second = json.loads(
            self.run_helper("apply", "--task-slug", "demo").stdout
        )
        self.assertEqual(second["status"], "ready")
        self.assertEqual(second["repositories"][0]["action"], "reuse")

    def test_occupied_destination_fails_without_mutation(self) -> None:
        destination = self.root / "occupied"
        destination.mkdir()
        (destination / "keep").write_text("unchanged")
        self.write_config(
            {
                "pathTemplate": str(destination),
                "branchTemplate": "{{ TASKSLUG }}",
                "repos": [{"localPath": ".", "primary": True}],
            }
        )
        result = self.run_helper("plan", "--task-slug", "demo", check=False)
        self.assertNotEqual(result.returncode, 0)
        payload = json.loads(result.stderr)
        self.assertIn("not the intended registered worktree", payload["error"])
        self.assertEqual((destination / "keep").read_text(), "unchanged")

    def test_multi_repository_apply_accounts_for_every_repo(self) -> None:
        secondary = self.root / "secondary"
        initialize_repo(secondary)
        destination_template = str(
            self.root / "multi" / "{{ TASKSLUG }}" / "{{ REPOBASENAME }}"
        )
        self.write_config(
            {
                "pathTemplate": destination_template,
                "branchTemplate": "task/{{ TASKSLUG }}",
                "repos": [
                    {"localPath": ".", "primary": True},
                    {
                        "localPath": "../secondary",
                        "setupCommand": "printf setup-log; printf secondary > setup.marker",
                    },
                ],
            }
        )
        result = json.loads(
            self.run_helper("apply", "--task-slug", "multi").stdout
        )
        self.assertEqual(result["status"], "ready")
        self.assertEqual(len(result["repositories"]), 2)
        self.assertTrue(all(repo["status"] == "ready" for repo in result["repositories"]))
        secondary_result = next(
            repo
            for repo in result["repositories"]
            if Path(repo["sourceRepo"]).resolve() == secondary.resolve()
        )
        self.assertEqual((Path(secondary_result["destination"]) / "setup.marker").read_text(), "secondary")

    def test_setup_failure_reports_retained_checkpoint(self) -> None:
        destination_template = str(self.root / "failed" / "{{ REPOBASENAME }}")
        self.write_config(
            {
                "pathTemplate": destination_template,
                "branchTemplate": "task/{{ TASKSLUG }}",
                "setupCommand": "false",
                "repos": [{"localPath": ".", "primary": True}],
            }
        )
        failed = self.run_helper("apply", "--task-slug", "failure", check=False)
        self.assertNotEqual(failed.returncode, 0)
        payload = json.loads(failed.stdout)
        record = payload["repositories"][0]
        self.assertEqual(payload["status"], "partial")
        self.assertEqual(record["failedOperation"], "running-setup")
        self.assertTrue(record["worktreeCreated"])
        self.assertEqual(record["verification"]["branch"], "task/failure")

    def test_reuse_copy_rejects_symlinked_parent_escape(self) -> None:
        destination_template = str(self.root / "symlink" / "{{ REPOBASENAME }}")
        self.write_config(
            {
                "pathTemplate": destination_template,
                "branchTemplate": "task/{{ TASKSLUG }}",
                "repos": [
                    {"localPath": ".", "copyGlobs": [".local/secret"], "primary": True}
                ],
            }
        )
        source_local = self.repo / ".local"
        source_local.mkdir()
        (source_local / "secret").write_text("source")
        first = json.loads(
            self.run_helper("apply", "--task-slug", "symlink").stdout
        )
        destination = Path(first["primaryWorktree"])
        shutil.rmtree(destination / ".local")
        outside = self.root / "outside"
        outside.mkdir()
        (destination / ".local").symlink_to(outside, target_is_directory=True)

        second = self.run_helper("apply", "--task-slug", "symlink", check=False)
        payload = json.loads(second.stdout)
        self.assertEqual(payload["status"], "partial")
        self.assertIn("escapes worktree through a symlink", payload["error"])
        self.assertFalse((outside / "secret").exists())

    def test_copy_glob_cannot_escape_repository(self) -> None:
        self.write_config(
            {
                "pathTemplate": str(self.root / "escape"),
                "repos": [
                    {"localPath": ".", "copyGlobs": ["../secret"], "primary": True}
                ],
            }
        )
        result = self.run_helper("plan", "--task-slug", "escape", check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("must stay relative", json.loads(result.stderr)["error"])

    def test_disabled_branch_can_be_planned_and_created(self) -> None:
        self.write_config(
            {
                "disabled": True,
                "branchTemplate": "task/{{ TASKSLUG }}",
                "sourceRef": "HEAD",
                "repos": [{"localPath": ".", "primary": True}],
            }
        )
        planned = json.loads(
            self.run_helper("branch", "--task-slug", "disabled").stdout
        )
        self.assertEqual(planned["action"], "create")
        applied = json.loads(
            self.run_helper("branch", "--task-slug", "disabled", "--apply").stdout
        )
        self.assertEqual(applied["status"], "ready")
        self.assertEqual(applied["branch"], "task/disabled")


if __name__ == "__main__":
    unittest.main()
