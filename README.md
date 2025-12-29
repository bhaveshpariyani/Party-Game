# Party Games Companion

A premium, design-focused Progressive Web App (PWA) to assist with your favorite party games: **Mafia** and **Judgement**.

## 🚀 Getting Started

### Installation
This is a PWA, meaning you can install it on your phone for offline use:
- **iOS**: Open in Safari -> Share -> "Add to Home Screen"
- **Android**: Open in Chrome -> Menu -> "Install App"

### Local Development
To run this project locally:
```bash
npm install
npm run dev
```

---

## 🕵️ Mafia
*A game of deception and deduction.*

### How to Use
1.  **Add Players**: Enter the names of all participants on the setup screen.
2.  **Assign Roles**: Configure how many of each role you want in the game:
    *   **Villagers**: Innocent civilians.
    *   **Mafia**: The bad guys. Know each other.
    *   **Doctor**: Can save one person per night.
    *   **Detective**: Can invetigate one person per night.
    *   **Godfather**: Leader of the mafia.
3.  **Reveal Roles**: Pass the phone around!
    *   The screen will show a "Pass to [Name]" card.
    *   The player takes the phone, taps to flip the card and see their secret role.
    *   They tap again to hide it before passing to the next person.
4.  **Presenter Mode**:
    *   Once everyone has seen their role, the phone returns to the **Presenter (Host)**.
    *   The Dashboard shows a master list of all roles.
    *   Use the **Timer** to manage discussion rounds.

---

## ⚖️ Judgement (Court Piece / Kaali Teri)
*A prediction-based card game scorepad.*

### How to Use
1.  **Setup**: Add player names.
2.  **Scoring Rules**:
    *   **Prepend Mode**: Adds a digit before the bid (Standard is '1'). E.g., Bid 3 -> Score 13.
    *   **Append Mode**: Appends a digit after the bid (Standard is '0'). E.g., Bid 3 -> Score 30.
    *   You can customize these digits (e.g. Prepend '2' or Append '5') in the settings.
3.  **Playing the Game**:
    *   Enter the **Trump Card** for the current round.
    *   Enter **Predictions** for each player.
    *   After the hand, use the **Toggle Slider** (Check/Cross) to indicate if the player won their bid.
    *   Click "Finish Game" to see the full scoreboard.
4.  **Scoring**:
    *   Scores are calculated automatically based on your rules.
    *   If a player misses their bid, they get 0.
    *   Click "Start Next Game" to continue.

---

## 🛠️ Built With
- React (Vite)
- Framer Motion (Animations)
- PWA (Offline Support)
- Github Pages (Hosting)
