# NFL Highlights - Spoiler-Free

En automatisk GitHub Pages-hemsida som visar de senaste NFL highlight-videorna mellan två lag, utan att avslöja resultat eller spoilers.

## 🏈 Funktioner

- **Spoiler-free design** - Inga resultat eller thumbnails som avslöjar utgången
- **Automatisk uppdatering** - Daglig uppdatering via GitHub Actions
- **Filtrering** - Filtrera på lag och vecka
- **Responsiv design** - Fungerar på desktop och mobil
- **Officiella källor** - Endast från officiella NFL YouTube-kanaler

## 🚀 Snabbstart

1. **Forka detta repository**
2. **Aktivera GitHub Pages** i repository-inställningarna
3. **Lägg till YouTube API-nyckel** som en GitHub Secret:
   - Gå till Settings → Secrets and variables → Actions
   - Lägg till `YOUTUBE_API_KEY` med din YouTube Data API v3-nyckel
4. **Sätt upp GitHub Actions** (aktiveras automatiskt)

## 📁 Projektstruktur

```
├── index.html              # Huvudsida
├── assets/
│   └── style.css          # Styling
├── scripts/
│   ├── app.js             # Frontend JavaScript
│   └── update-highlights.js # YouTube API integration
├── highlights.json         # Highlights data (uppdateras automatiskt)
├── .github/workflows/
│   └── update-highlights.yml # GitHub Actions workflow
└── package.json           # Node.js dependencies
```

## 🔧 Konfiguration

### YouTube API Setup

1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa ett nytt projekt eller välj befintligt
3. Aktivera YouTube Data API v3
4. Skapa API-nycklar
5. Lägg till nyckeln som `YOUTUBE_API_KEY` i GitHub Secrets

### GitHub Pages

1. Gå till repository Settings
2. Scrolla ner till "Pages" sektionen
3. Välj "Deploy from a branch"
4. Välj "main" branch och "/ (root)" folder
5. Klicka "Save"

## 🎨 Design

Designen är inspirerad av [dtmts.com](https://dtmts.com) med fokus på:
- Ren, modern layout
- Gradient bakgrunder
- Glassmorphism-effekter
- Responsiv design
- Spoiler-free element

## 📱 Användning

### Filtrering
- **Lag**: Välj specifikt lag för att se endast deras matcher
- **Vecka**: Filtrera på specifik vecka i säsongen
- **Sortering**: Sortera efter datum eller vecka

### Tittande
- Klicka på "Titta på highlights" för att öppna videon i ny flik
- Inga spoilers eller resultat visas på hemsidan
- Endast officiella NFL-kanaler används som källa

## 🔄 Automatisk uppdatering

GitHub Actions körs dagligen kl 06:00 UTC och:
1. Hämtar nya highlights från YouTube API
2. Filtrerar på officiella NFL-kanaler
3. Uppdaterar `highlights.json`
4. Pushar ändringar till main branch
5. GitHub Pages uppdateras automatiskt

## 🛠️ Utveckling

### Lokal utveckling

```bash
# Klona repository
git clone <your-repo-url>
cd nfl-highlights

# Installera dependencies
npm install

# Kör uppdatering manuellt
npm run update
```

### Testa GitHub Actions

Du kan manuellt trigga GitHub Actions från:
1. Gå till "Actions" fliken i ditt repository
2. Välj "Update NFL Highlights" workflow
3. Klicka "Run workflow"

## 📊 Dataformat

`highlights.json` innehåller:

```json
{
  "lastUpdated": "2024-01-15T10:00:00Z",
  "highlights": [
    {
      "id": "unique-id",
      "team1": "Kansas City Chiefs",
      "team2": "Buffalo Bills",
      "week": 18,
      "date": "2024-01-07",
      "description": "Wild Card Round - Kansas City Chiefs vs Buffalo Bills",
      "videoId": "youtube-video-id",
      "channel": "NFL"
    }
  ]
}
```

## 🔒 Säkerhet

- YouTube API-nycklar lagras säkert i GitHub Secrets
- Ingen känslig data exponeras i frontend
- Endast publika YouTube-videor används

## 📝 Licens

MIT License - se LICENSE fil för detaljer.

## 🤝 Bidrag

Bidrag är välkomna! Öppna en issue eller pull request för förslag på förbättringar.

## 📞 Support

Om du stöter på problem:
1. Kontrollera att YouTube API-nyckeln är korrekt konfigurerad
2. Verifiera att GitHub Actions har rätt behörigheter
3. Öppna en issue med detaljerad beskrivning
