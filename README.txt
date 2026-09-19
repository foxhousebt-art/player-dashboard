PLAYER DASHBOARD V0.3

1. Ouvrir index.html dans Chrome, Edge ou Safari.
2. Mettre le navigateur en plein écran.
3. L'interface utilise encore des données locales de démonstration.
4. Le personnage respire légèrement et des lueurs parcourent les panneaux.
5. Pour tester le futur événement LEVEL UP : appuyer sur la touche L, ou cliquer sur “TEST LEVEL UP” en bas à droite.
6. Prochaine étape : connecter les valeurs du moteur V0.2 / Google Sheets, puis remplacer le bouton test par des événements automatiques.

Fichiers :
- index.html : structure de l’écran
- styles.css : direction artistique et animations
- app.js : données, calculs d'affichage et effet Level Up
- avatar_brian.png : avatar issu de la maquette validée

CORRECTIF V0.3.1
- Le raccourci LEVEL UP accepte maintenant L / l / KeyL.
- Le bouton TEST LEVEL UP est plus visible.
- Cliquer sur le grand numéro du niveau global déclenche aussi l'animation.
- La page tente de reprendre automatiquement le focus au chargement.

CORRECTIF V0.3.2
- Correction d'une erreur JavaScript qui empêchait tous les événements interactifs.
- Si tout fonctionne, le bas de l'écran affiche : SYSTEME EN LIGNE — JS OK.
- Test LEVEL UP : touche L, bouton TEST LEVEL UP, ou clic sur le grand niveau global.

CORRECTIF V0.3.3
- Le test LEVEL UP augmente maintenant réellement le niveau global de +1.
- Le nouveau niveau est sauvegardé dans le navigateur via localStorage.
- En fermant puis rouvrant index.html, le niveau reste mémorisé.
- Touche R = remise à zéro du niveau de test à 1.


V0.3.5 — MOTEUR D'EVOLUTION DES SPRITES
- Retour complet à la DA noire de la V0.3.3.
- Aucun effet graphique permanent supplémentaire.
- Le personnage change désormais automatiquement de fichier PNG selon le niveau.
- 8 paliers préparés : 1, 5, 10, 20, 35, 50, 75, 100.
- Les sprites sont encore identiques volontairement.
- Les futurs personnages pourront être remplacés sans modifier le reste du code.
- Voir EVOLUTIONS_PERSONNAGE.txt.


V0.3.6 — CORRECTIF CLAVIER
- Un seul écouteur clavier gère désormais L et R.
- Un appui sur L = +1 niveau exactement.
- R remet le niveau de test à 1.
- Petit anti-double-trigger ajouté.
- Le moteur de sprites reste actif.
- IMPORTANT : les sprites des paliers sont encore visuellement identiques tant que les vrais PNG évolutifs ne sont pas remplacés.
