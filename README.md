# 🐵 Mordicus 2 🍌

### Reproduction en JavaScript du jeu Mordicus 2

Ce projet est une reproduction de Mordicus 2, un jeu développé par Loto-Québec paru au courant des années 1990 sur le terminal de [Vidéoway](https://fr.wikipedia.org/wiki/Vid%C3%A9oway). Le code source du jeu étant perdu, il est désormais impossible d'y jouer dans sa version originale.

Cette reproduction a été rendue possible grâce à l'excellent travail de Maxime de la chaîne YouTube [Des Jeux pis d'la Bière](https://youtube.com/@jeuxbiere?feature=shared). Les 240 niveaux du jeu frère [Mozaic](https://youtu.be/YygmFM3qP8w?feature=shared), que Maxime a [répertoriés et archivés](https://archive.org/details/mozaic-240-levels/001.png), sont inclus dans ce projet. Quelques niveaux ont été déplacés, notamment les niveaux [148](https://archive.org/details/mozaic-240-levels/148.png), [142](https://archive.org/details/mozaic-240-levels/142.png) et [143](https://archive.org/details/mozaic-240-levels/143.png) qui sont positionnés au tout début puisque ce sont les 3 premiers niveaux connus du jeu original Mordicus 2. Si vous repérez des erreurs de recopie des niveaux, veuillez m'en informer.

## Installation

Le jeu est hébergé sur itch.io à l'adresse [https://bouc1620.itch.io/mordicus-2](https://bouc1620.itch.io/mordicus-2). Il vous est possible d'y jouer directement dans votre navigateur ou sur votre ordinateur en téléchargeant le fichier d'installation Electron.

La task pour générer l'installateur existe seulement pour Windows. Générez l'installateur Electron avec la task "make". Un fichier d'installation nommé "Mordicus 2 - Setup.exe" sera créé dans le dossier ./out/make.

## Contrôles

Mordicus se dirige avec les flèches du clavier.
Appuyez sur _Espace_ ou _Entrée_ pour le caractère ✓.
Faites la touche _Échap_ à tout moment pour abandonner et recommencer le niveau.
À la difficulté facile, cette reproduction comporte une fonction "undo/redo" qui annule ou réexécute un coup. Utilisez la avec les touches _Z_ et _Y_.

Fonctionne également avec une manette de jeu (développé avec une manette de Xbox).

Les meilleurs pointages pour chacun des niveaux et le code d'accès du dernier niveau joué sont sauvegardés en localStorage, ils persistent après la fermeture de l'application.

## Captures

Écran titre du jeu original:

<p align="center"><img src="captures/original/titre.png" alt="écran titre original"></img></p>

Captures de la reproduction:

<p align="center"><img src="captures/reproduction/titre.png" alt="écran titre reproduit"></img></p>

<p align="center"><img src="captures/reproduction/097.png" alt="niveau 97"></img></p>

<p align="center"><img src="captures/reproduction/041.png" alt="niveau 41"></img></p>
