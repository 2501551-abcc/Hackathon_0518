// 🌟 通知がクリックされた時のイベント
self.addEventListener('notificationclick', (event) => {
    // 画面がピコンと開くまで通知を閉じないようにするおまじない
    event.preventDefault(); 
    
    // 通知を閉じる
    event.notification.close();

    // 🌟 HTML側で仕込んだ遷移先URL（data.url）を取り出す
    const targetUrl = event.notification.data.url;

    // 🌟 スマホOSに対して「このURLの画面を新しく開け！」と正式に命令する
    event.waitUntil(
        clients.openWindow(targetUrl)
    );
});