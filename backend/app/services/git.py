"""Git service — creates GitHub repos and manages local clones for projects."""

from __future__ import annotations

import os
import subprocess
import json
from pathlib import Path
from typing import Optional


REPOS_DIR = Path(os.environ.get("COMPANY_REPOS_DIR", "/tmp/company-repos"))
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_ORG = os.environ.get("GITHUB_ORG", "")  # optional: create repos under an org


class GitService:
    """Manages GitHub repos and local working directories for projects."""

    def __init__(self) -> None:
        REPOS_DIR.mkdir(parents=True, exist_ok=True)

    def create_repo(
        self,
        name: str,
        description: str = "",
        private: bool = False,
    ) -> Optional[str]:
        """Create a GitHub repo and return its URL. Returns None if no token."""
        if not GITHUB_TOKEN:
            return None

        # create via GitHub API
        if GITHUB_ORG:
            url = f"https://api.github.com/orgs/{GITHUB_ORG}/repos"
        else:
            url = "https://api.github.com/user/repos"

        result = subprocess.run(
            [
                "curl", "-s", "-X", "POST", url,
                "-H", f"Authorization: token {GITHUB_TOKEN}",
                "-H", "Content-Type: application/json",
                "-d", json.dumps({
                    "name": name,
                    "description": description,
                    "private": private,
                    "auto_init": False,
                }),
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )

        try:
            data = json.loads(result.stdout)
            return data.get("html_url") or data.get("clone_url")
        except (json.JSONDecodeError, KeyError):
            return None

    def init_local(self, project_name: str, repo_url: str) -> Path:
        """Initialize a local working directory for a project."""
        project_dir = REPOS_DIR / project_name
        if project_dir.exists():
            return project_dir

        project_dir.mkdir(parents=True, exist_ok=True)

        # configure git with token for push access
        push_url = repo_url
        if GITHUB_TOKEN and "github.com" in repo_url:
            push_url = repo_url.replace(
                "https://github.com/",
                f"https://x-access-token:{GITHUB_TOKEN}@github.com/",
            )

        subprocess.run(["git", "init"], cwd=project_dir, capture_output=True, timeout=10)
        subprocess.run(
            ["git", "remote", "add", "origin", push_url],
            cwd=project_dir, capture_output=True, timeout=10,
        )

        return project_dir

    def init_project_files(
        self,
        project_name: str,
        plan: str = "",
        program: str = "",
        gates: dict[str, str] | None = None,
    ) -> Path:
        """Create initial project files and make the first commit."""
        project_dir = REPOS_DIR / project_name
        if not project_dir.exists():
            return project_dir

        # plan.md
        if plan:
            (project_dir / "plan.md").write_text(plan)

        # program.md
        if program:
            (project_dir / "program.md").write_text(program)

        # project.yaml
        gate_lines = "\n".join(f"  {k}: {v}" for k, v in (gates or {}).items())
        (project_dir / "project.yaml").write_text(
            f"name: {project_name}\n"
            f"gates:\n{gate_lines}\n" if gate_lines else f"name: {project_name}\n"
        )

        # README
        (project_dir / "README.md").write_text(f"# {project_name}\n")

        # .gitignore
        (project_dir / ".gitignore").write_text(
            "node_modules/\n.venv/\n__pycache__/\n*.pyc\n.env\n"
        )

        # commit + push
        subprocess.run(["git", "add", "-A"], cwd=project_dir, capture_output=True, timeout=10)
        subprocess.run(
            ["git", "commit", "-m", f"feat: initial project setup for {project_name}"],
            cwd=project_dir, capture_output=True, timeout=10,
        )
        subprocess.run(
            ["git", "push", "-u", "origin", "master"],
            cwd=project_dir, capture_output=True, timeout=30,
        )

        return project_dir

    def get_project_dir(self, project_name: str) -> Path:
        return REPOS_DIR / project_name

    def create_branch(self, project_name: str, branch_name: str) -> bool:
        """Create a branch for an agent in a project repo."""
        project_dir = REPOS_DIR / project_name
        if not project_dir.exists():
            return False

        result = subprocess.run(
            ["git", "checkout", "-b", branch_name],
            cwd=project_dir, capture_output=True, timeout=10,
        )
        # go back to master
        subprocess.run(
            ["git", "checkout", "master"],
            cwd=project_dir, capture_output=True, timeout=10,
        )
        return result.returncode == 0
