Notification.requestPermission().then(
	console.log
)
// > granted （許可された場合）
// > denied （許可されなかった場合）
// > default （どちらでもない場合）

new Notification("テスト", {
	body: "テストです"
});