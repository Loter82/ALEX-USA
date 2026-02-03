# 🔒 Git Security - Remove API Keys from History

## ⚠️ ВАЖЛИВО!

API ключі були видалені з коду, але вони все ще є в історії Git. GitHub може їх виявити.

## Рішення 1: Regenerate API Keys (Рекомендовано)

Найпростіше і найбезпечніше рішення:

1. **ATTOM API**: https://api.developer.attomdata.com/
   - Login → API Keys → Regenerate Key
   - Оновіть новий ключ в `config.js`

2. **Google Places API**: https://console.cloud.google.com/
   - APIs & Services → Credentials
   - Видаліть старий ключ → Створіть новий
   - Оновіть новий ключ в `config.js`

3. Push changes:
```bash
git push origin main --force
```

## Рішення 2: Clean Git History (Складніше)

Якщо потрібно видалити ключі з історії:

### Використовуючи BFG Repo-Cleaner (швидко):

1. Завантажте BFG: https://rtyley.github.io/bfg-repo-cleaner/
2. Створіть файл `keys.txt` з вашими ключами:
```
89ce29e3f588213a695f4c6badc9284e
AIzaSyB0FDrhjBjzFqQNrucHOeIuM4mFkhDYCG8
```
3. Запустіть:
```bash
java -jar bfg.jar --replace-text keys.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin main --force
```

### Використовуючи git filter-branch (вбудовано):

```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch script.js" \
  --prune-empty --tag-name-filter cat -- --all

git push origin main --force
```

## ✅ Після Очищення

1. Всі розробники повинні зробити:
```bash
git pull origin main --rebase
```

2. Видаліть локальні бекапи Git:
```bash
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

3. Перевірте на GitHub: Settings → Security → Secret scanning alerts

## 📝 Що Зроблено

✅ API ключі винесені в `config.js`
✅ Додано `config.js` в `.gitignore`
✅ Створено `config.example.js` як шаблон
✅ Оновлено `script.js` для читання з CONFIG
✅ Підключено `config.js` в HTML файлах

## 🚀 Поточний Стан

- Новий коміт не містить ключів
- config.js не буде комітитись
- Старі коміти все ще містять ключі в історії

**Рекомендація: Regenerate API Keys - найпростіше і найбезпечніше!**
