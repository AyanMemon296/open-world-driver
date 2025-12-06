# Open World Driver 🏎️💨

 

**Open World Driver** is a high-performance 3D infinite driving sandbox built entirely with **JavaScript, Three.js, and Cannon.es**. It features procedural city generation, realistic physics-based drifting, vehicle customization, and a fully responsive mobile interface.

👉 **Play Live:** [https://ayanmemon296.github.io/open-world-driver/](https://ayanmemon296.github.io/open-world-driver/)

-----

## 🌟 Key Features

### 1\. The Core Engine ⚙️

  * **3D Rendering:** Utilizes **Three.js** for high-performance graphics, shadows, and lighting.
  * **Physics Simulation:** Integrated **Cannon-es** for realistic gravity, mass, collision detection, and suspension logic.
  * **Optimized Game Loop:** synchronized 60 FPS animation loop handling physics and rendering simultaneously.

### 2\. Infinite Environment 🏙️

  * **Procedural City:** Randomly generates hundreds of buildings while maintaining a clear "Main Street" for high-speed driving.
  * **World Wrapping:** Implements seamless teleportation logic (Pac-Man style) to create an **infinite loop illusion** without performance costs.
  * **Atmosphere:** Realistic sky shader, distance fog, and dynamic day-time lighting.
  * **Dynamic Textures:** Procedurally generated building textures (concrete & windows) created via code.

### 3\. Advanced Vehicle System 🚘

  * **Code-Generated Models:** Custom 3D car models built programmatically (Chassis, Wheels, Spoilers, Headlights) removing the need for external asset downloads.
  * **Drifting Mechanics:** **Handbrake (Space)** logic that alters tire friction coefficients in real-time for arcade-style drifting.
  * **Vehicle Switcher (V Key):**
      * 🏎️ **F1 Racer:** High speed, maximum grip.
      * 🚙 **Rally Car:** Slippery handling, perfect for drifting.
      * 🛻 **Cyber Truck:** Heavy mass, high momentum, unstoppable.

### 4\. Gamification & UI 🎮

  * **Time Attack Mode:** 60-second countdown timer to collect maximum coins.
  * **High Score System:** Uses `localStorage` to persist your best score across browser sessions.
  * **Smart HUD:** Real-time Speedometer (km/h), Timer, and Scoreboard.
  * **Mini-Map Radar:** A functional GPS in the bottom-left using a secondary Orthographic Camera and Scissor Testing.

### 5\. Mobile & Polish 📱

  * **Touch Controls:** Custom on-screen interface for Gas, Brake, Steering, and Actions.
  * **Responsive Design:** Smart layout that adapts to PC and Portrait Mobile (9:16) screens.
  * **Dynamic FOV:** Automatically adjusts camera field-of-view on narrow screens to ensure the road remains visible.

-----

## 🕹️ Controls

| Action | Keyboard / Touch Screen |
| :--- | :--- |
| **Steer** | `A` / `D` |
| **Accelerate** | `W` Green Button |
| **Brake/Reverse** | `S` Red Button |
| **Handbrake** | `SPACE` |
| **Change Car** | `V` |
| **Change Camera** | `C` |
| **Reset Car** | `R` |

-----

## 🛠️ Tech Stack

  * **Language:** JavaScript (ES6 Modules)
  * **3D Library:** [Three.js](https://threejs.org/)
  * **Physics Engine:** [Cannon-es](https://github.com/pmndrs/cannon-es)
  * **Structure:** HTML5 / CSS3

-----

## 🚫 Usage Restrictions

  * The content, design, code, and logic of **Open World Driver** are the **original work of Ayan Memon**.
  * You are **strictly prohibited** from copying, reproducing, modifying, or redistributing this project, website, or any part of it without **explicit written permission** from the author.
  * Any unauthorized use, including **removing credits or reusing the project as your own**, may lead to **legal consequences** including but not limited to:
      * **DMCA Takedown Notices**
      * **Copyright infringement claims**
      * **Permanent removal from hosting platforms**
  * This project is shared for **educational and portfolio purposes only**, not for commercial misuse or unethical replication.

> ⚠️ **This project is strictly protected.** You are **not allowed** to reuse, copy, host, or modify any part of this code or design. Violations will lead to copyright actions.
>
> 🚫 **"Open World Driver" is the original and protected work of Ayan Memon. Unauthorized use of the Name, Code, or Design is strictly prohibited.**

-----

## 👤 About the Creator

  * **Created by:** Ayan Memon
  * **GitHub:** [AyanMemon296](https://github.com/AyanMemon296)
  * **YouTube:** [@ayanmemon2926](https://www.youtube.com/@ayanmemon2926)
  * **LinkedIn:** [Ayan Memon](https://www.linkedin.com/in/ayanmemon296/)

-----

© 2025 Open World Driver | All Rights Reserved
