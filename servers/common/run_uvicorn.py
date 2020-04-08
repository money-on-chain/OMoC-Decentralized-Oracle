import uvicorn
from fastapi import FastAPI

from common import settings


def get_app(title, description):
    config = {"debug": settings.UVICOIN_DEBUG,
              "title": title,
              "description": description,
              "version": settings.VERSION,
              }
    if not settings.DEBUG_ENDPOINTS:
        config = {**config, **{
            "docs_url": None,
            "redoc_url": None
        }}
    return FastAPI(**config)


def run_uvicorn(app, port):
    if settings.LOG_LEVEL not in uvicorn.config.LOG_LEVELS.keys():
        raise Exception("Invalid log level %s" % settings.LOG_LEVEL)
    uvicorn.run(app, host="0.0.0.0",
                port=port,
                log_level=settings.LOG_LEVEL,
                reload=settings.RELOAD)
