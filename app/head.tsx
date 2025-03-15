export default function Head() {
    return (
      <>
        <title>WatchPick - Список перегляду фільмів</title>
        <meta name="description" content="Додаток для пошуку фільмів та створення списку перегляду" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        
        {/* Мета-теги для iOS */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="WatchPick" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        
        {/* Іконка для Android */}
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        
        {/* Колір теми для Chrome, Firefox і Safari */}
        <meta name="theme-color" content="#3b82f6" />
      </>
    );
  }