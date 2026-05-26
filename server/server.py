from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

# スマホから送られてくるデータ（通知時間と回数）の形を定義
class NotificationSetting(BaseModel):
    time: str     # 例: "20:00"
    count: int    # 例: 3

# スマホからデータを受け取る窓口（API）
@app.post("/set-notification")
def set_notification(setting: NotificationSetting):
    # ここに「データベースに保存する」などの処理を書く
    print(f"ユーザーが {setting.time} に {setting.count} 回の通知を設定しました")
    return {"status": "success", "message": "設定を保存しました"}