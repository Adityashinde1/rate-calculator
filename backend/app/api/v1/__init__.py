from fastapi import APIRouter

from app.api.v1 import auth, jobs, materials, operations, quotes, settings, shapes

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(materials.router, prefix="/materials", tags=["materials"])
api_router.include_router(operations.router, prefix="/operations", tags=["operations"])
api_router.include_router(shapes.router, prefix="/shapes", tags=["shapes"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
api_router.include_router(quotes.router, prefix="/quotes", tags=["quotes"])
