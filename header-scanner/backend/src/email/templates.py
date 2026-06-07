from pathlib import Path
from jinja2 import Environment, FileSystemLoader

_TEMPLATE_DIR = Path(__file__).parent / "templates"
_env = Environment(loader=FileSystemLoader(str(_TEMPLATE_DIR)), autoescape=True)


def render_template(name: str, context: dict) -> str:
    tmpl = _env.get_template(name)
    return tmpl.render(**context)
