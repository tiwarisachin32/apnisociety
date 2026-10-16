# Package marker for backend routers
import sys
from pathlib import Path

_routers_dir = Path(__file__).resolve().parent
_backend_dir = _routers_dir.parent
_project_root = _backend_dir.parent

for _p in [str(_project_root), str(_backend_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    import types
    backend_pkg = types.ModuleType("backend")
    backend_pkg.__path__ = [str(_backend_dir)]
    sys.modules["backend"] = backend_pkg
