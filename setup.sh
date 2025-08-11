#!/bin/bash

echo "🚀 Configuration du projet Demoucron..."

# 1. Installer Node.js et npm (si pas déjà installé)
echo "📦 Installation de Node.js et npm..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Vérifier les versions
echo "✅ Versions installées:"
node --version
npm --version

# 3. Installer les dépendances du projet
echo "📚 Installation des dépendances React..."
npm install

# 4. Créer le dossier scripts s'il n'existe pas
mkdir -p scripts

echo "✅ Configuration terminée!"
echo ""
echo "🔧 Pour démarrer le projet:"
echo "1. Terminal 1: python3 scripts/flask_server.py"
echo "2. Terminal 2: npm run dev"
echo ""
echo "🌐 L'application sera disponible sur:"
echo "- Frontend React: http://localhost:3000"
echo "- Backend Flask: http://localhost:5001"
