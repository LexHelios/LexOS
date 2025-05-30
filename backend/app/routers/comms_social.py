from fastapi import APIRouter
from ..services.social_service import post_tweet

router = APIRouter(prefix="/social")

@router.post("/post_tweet")
def social_post_tweet(message: str):
    return post_tweet(message) 