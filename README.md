# Din - Guide Islamique

Application web islamique moderne, épurée et sans publicité. Une application complète pour accompagner les musulmans dans leur pratique quotidienne.

## ✨ Fonctionnalités

### 🕌 Horaires de Prière
- Calcul automatique des horaires de prière basé sur votre géolocalisation
- Affichage de toutes les prières (Fajr, Dhuhr, Asr, Maghrib, Isha)
- Indication de la prière en cours et de la prochaine prière
- Dates hijri et grégorienne
- Mise à jour automatique chaque minute

### 📖 Le Saint Coran
- Texte complet du Coran (114 sourates)
- Traductions disponibles :
  - 🇫🇷 Français (Hamidullah)
  - 🇬🇧 English (Sahih International)
  - 🇹🇷 Türkçe (Diyanet)
  - 🇸🇦 العربية (Texte original)
- Navigation facile entre les sourates
- Interface de lecture optimisée

### 🧭 Boussole Qibla
- Calcul précis de la direction de la Qibla (La Mecque)
- Boussole interactive utilisant les capteurs de l'appareil
- Indication visuelle claire de la direction

### 🎨 Interface Moderne
- Design épuré et minimaliste
- Mode sombre / clair avec persistance
- 100% responsive (mobile, tablette, desktop)
- Navigation par onglets intuitive
- Sans publicité

### 📱 Progressive Web App (PWA)
- Installation sur mobile comme une application native
- Fonctionne hors ligne (après première visite)
- Icône sur l'écran d'accueil

## 🚀 Technologies Utilisées

- **Vite** - Build tool moderne et rapide
- **Tailwind CSS 4** - Framework CSS utility-first
- **Vanilla JavaScript** - Aucune dépendance framework, performances optimales
- **APIs publiques** :
  - [Al-Adhan API](https://aladhan.com/prayer-times-api) - Horaires de prière
  - [Al-Quran Cloud API](https://alquran.cloud/api) - Texte du Coran
  - [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) - Géocodage inverse

## 📦 Installation et Développement

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Build pour la production
npm run build

# Prévisualiser le build de production
npm run preview
```

## 🌐 Déploiement

L'application peut être déployée sur n'importe quelle plateforme supportant les sites statiques :
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

## 📄 Licence

Ce projet est open source et disponible sous licence MIT.

## 🤲 Conformité Religieuse

Cette application utilise :
- Des sources de données reconnues et acceptées par les oulémas
- La méthode de calcul ISNA (Islamic Society of North America) pour les horaires de prière
- Des traductions du Coran approuvées et reconnues

## 🙏 Contributions

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs
- Proposer de nouvelles fonctionnalités
- Améliorer la documentation
- Ajouter de nouvelles traductions

---

**Développé avec ❤️ pour la communauté musulmane**
