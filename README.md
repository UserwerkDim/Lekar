
# Православная книга — мобильное приложение (Android/iOS, Expo)

## Возможности
- Двухуровневое оглавление (Разделы — Вопросы).
- Поиск по тексту.
- Закладки (локально, оффлайн).
- Изменение размера шрифта и гарнитуры.
- Тёмная тема (авто по системной).
- В конец каждого ответа добавляется малоконтрастная подпись «Сост. Д.Г.Семеник orthopsy.ru».

## Как запустить
1. Установите Node.js LTS.
2. В терминале:
```bash
npm install
npx expo start
```
3. Откройте на Android/iOS через Expo Go либо соберите нативные пакеты:
```bash
npx expo run:android
npx expo run:ios
```

## Где лежит контент
`data/content.json` — сгенерирован из вашего DOCX. Если обновите книгу — замените этот файл и перезапустите приложение.

## Иконка
`assets/icon.png` — ваш логотип.

---

## Быстрые команды EAS

### Android
- Тестовый APK (раздача друзьям):
```bash
eas build -p android --profile preview
```

- Релизный AAB (для Google Play):
```bash
eas build -p android --profile production
```

### iOS
- Релизный IPA (для App Store / TestFlight):
```bash
eas build -p ios --profile production
eas submit -p ios
```
