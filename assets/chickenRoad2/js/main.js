

class ChickenRoadGame {
  constructor() {
    this.game = document.getElementById("game");
    this.char = document.getElementById("game-char");
    this.field = document.getElementById("game-field");
    this.sectors = document.querySelectorAll(".game__sector");
    this.spinButton = document.getElementById("go-btn");
    this.cashButton = document.getElementById("cash-btn");
    this.winButton = document.getElementById("win-button-modal");
    this.modal = document.getElementById("modal");
    this.controls = document.getElementById("game-controls");
    this.balance = document.getElementById("balance");
    // this.modalBalance = document.getElementById("modal-balance");
    this.modalMultiplier = document.getElementById("modal-multiplier");
    this.charMultiplier = document.getElementById("char-multiplier");
    this.charMultiplierElement = document.getElementById(
      "char-multiplier-element"
    );
    this.effectsContainer = document.getElementById("effects");
    this.effectsImage = document.getElementById("effects-image");

    // Game data
    this.rate = document.getElementById("rate").dataset.rate;
    this.multipliers = document
      .getElementById("rate")
      .dataset.multipliers.split(",");
    this.sectorWidth = this.sectors[0].offsetWidth;
    this.charMoves = 0;
    this.currentStep = 0;
    this.firstStepIndex = 1;
    this.lastStepIndex = 22;
    this.stepTime = 700;
    this.spaceScrolled = window.innerWidth;
    this.isDesktop = window.innerWidth > 768;

    // Валюта и курсы
    this.currency = "€";
    this.exchangeRate = 1;

    
  }

  async detectCurrency() {
    console.log("detectCurrency вызван");
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();

      const countryCode = (data.country_code || "").toUpperCase();
      console.log("DEBUG country_code:", countryCode);

      if (countryCode === "US") {
        this.currency = "$";
        this.exchangeRate = 1.07;
      } else if (countryCode === "GB") {
        this.currency = "£";
        this.exchangeRate = 0.86;
      } else {
        this.currency = "€";
        this.exchangeRate = 1;
      }

      document
        .querySelectorAll(
          ".game-controls__cash-btn-inner span:last-child, .modal__balance-currency"
        )
        .forEach((el) => {
          el.textContent = this.currency;
        });

      console.log("Определена страна:", countryCode, "Валюта:", this.currency);
    } catch (err) {
      console.error("Ошибка получения IP:", err);
    }
  }

  initGame() {
    // Подгружаем валюту по IP
    console.log("initGame вызван"); // 👈 проверка
    this.detectCurrency();
    this.showNextSector(this.currentStep);
    this.calculateFontSize(this.spinButton);
    this.calculateFontSize(this.cashButton);
    this.calculateFontSize(this.winButton, {
      threshold: 30,
      step: 0.02,
      minPercent: 0.6,
    });

    window.addEventListener("placementOpenModal", () => {
      this.showModal();
    });

    this.spinButton.addEventListener("click", () => {
      this.initSpin();
    });

    this.cashButton.addEventListener("click", () => {
      this.showEffects();
      this.triggerShowModal();
    //   this.playSound(this.cashOutSound);
      this.disableControls(10000);
    });
  }

  initSpin() {
    if (
      window.isMobile &&
      window.pushPlacement &&
      !window.firstClick &&
      this.currentStep === 0
    ) {
      window.dispatchEvent(
        new CustomEvent("placementFirstClick", {
          detail: [this.spin.bind(this)],
        })
      );
    } else {
      this.spin();
    }
  }

  spin() {
    this.currentStep += 1;
    // this.playSound(this.spinSound);

    if (
      this.isDesktop &&
      (this.currentStep === this.firstStepIndex ||
        this.currentStep === this.lastStepIndex ||
        this.spaceScrolled > this.field.offsetWidth)
    ) {
      this.charMoves += 1;
    }

    // this.playSound(this.jumpSound, 100);
    this.moveChar(this.currentStep);
    this.moveField(this.currentStep);
    this.disableControls(this.stepTime);

    setTimeout(() => {
      this.showNextSector(this.currentStep);
      this.showActiveSector(this.currentStep);
      this.showFinishedSector(this.currentStep);
      this.updateBalance(this.currentStep);
      this.updateMultiplier(this.currentStep);
    }, this.stepTime / 2);

    if (this.currentStep === this.firstStepIndex) {
      this.setControlPanelActivated();
      setTimeout(() => {
        this.showCharMultiplier();
      }, this.stepTime);
    }

    // === Проигрыш на секторе 10 ===
    if (this.currentStep === 10) {
      setTimeout(() => {
        const sector = this.sectors[this.currentStep - 1];
        const car = sector.querySelector(".game__sector-car");

        car.style.animation = "none";
        void car.offsetWidth;
        car.style.animation = "1s moveCar linear";

        this.char.querySelector("img").src =
          "assets/chickenRoad2/img/chicken-dead.png";

        this.showLoseModal();
        this.disableControls(10000);

        car.addEventListener(
          "animationend",
          () => {
            car.style.animation = "4s moveCar ease-in-out infinite";
          },
          { once: true }
        );
      }, this.stepTime);
    }
  }

  calculateFontSize(
    element,
    options = { threshold: 25, step: 0.03, minPercent: 0.6 }
  ) {
    if (!element) return;

    const spans = element.querySelectorAll("span");
    if (!spans) return;

    spans.forEach((span) => {
      const textLength = String(span.innerText).length;
      const computedStyle = window.getComputedStyle(span);
      const originalFontSize = parseFloat(
        computedStyle.getPropertyValue("font-size")
      );
      const minFontSize = originalFontSize * options.minPercent;
      const lengthDifference = Math.max(0, textLength - options.threshold);
      const adjustedFontSize = Math.max(
        originalFontSize - lengthDifference * (originalFontSize * options.step),
        minFontSize
      );

      span.style.fontSize = `${adjustedFontSize}px`;
    });
  }

  showNextSector(step) {
    const sector = this.sectors[step];
    if (sector) {
      sector.classList.add("is--next");
    }
  }

  showActiveSector(step) {
    const sector = this.sectors[step - 1];
    if (sector) {
      sector.classList.add("is--active");
      sector.classList.remove("is--next");
    }
  }

  showFinishedSector(step) {
    const sector = this.sectors[step - 2];
    if (sector) {
      sector.classList.add("is--finished");
      sector.classList.remove("is--next");
      sector.classList.remove("is--active");
    }
  }

  showCharMultiplier() {
    this.charMultiplierElement.classList.add("is--active");
  }

  hideCharMultiplier() {
    this.charMultiplierElement.classList.remove("is--active");
  }

  moveChar(step) {
    this.char.classList.add("is--active");
    this.char.style.transform = `translateX(0)`;
    setTimeout(() => {
      this.char.classList.remove("is--active");
    }, this.stepTime);
  }

  moveField(step) {
    const translateX = this.sectorWidth * step;
    this.field.style.transform = `translateX(-${translateX}px)`;
  }

  setControlPanelActivated() {
    this.controls.classList.add("is--active");
  }

  updateBalance(step) {
    const idx = Math.max(0, step - 1);
    const multiplier = parseFloat(this.multipliers[idx] || 1);
    const newBalance = (this.rate * multiplier * this.exchangeRate).toFixed(2);

    this.balance.innerText = newBalance;
    // this.modalBalance.innerText = newBalance;
  }

  updateMultiplier(step) {
    const idx = Math.max(0, step - 1);
    const currentMultiplier = this.multipliers[idx] || 1;

    this.modalMultiplier.innerText = currentMultiplier + "x";
    this.charMultiplier.innerText = currentMultiplier + "x";
  }

  disableControls(time) {
    this.spinButton.setAttribute("disabled", "");
    if (time) {
      setTimeout(() => {
        this.spinButton.removeAttribute("disabled");
      }, time);
    }
  }

  showEffects(delay = 0, duration = 1500) {
    this.effectsContainer.classList.add("visible");

    setTimeout(() => {
      const effectElement = document.createElement("div");
      effectElement.style.backgroundImage = `url(${this.effectsImage.src})`;
      effectElement.classList.add("effects__block");
      this.effectsContainer.appendChild(effectElement);

      setTimeout(() => {
        this.effectsContainer.classList.remove("visible");
        this.effectsContainer.classList.add("hidden");
      }, duration);
    }, delay);
  }

  showModal() {
    document.body.classList.add("is--modal-open");
    this.modal.classList.add("is--active");
  }

//   playSound(sound, delay = 0) {
//     setTimeout(() => {
//       sound.muted = false;
//       sound.currentTime = 0;
//       sound.play().catch((error) => {
//         console.error("Ошибка при воспроизведении аудио: ", error);
//       });
//     }, delay);
//   }

  triggerShowModal(delay = 0) {
    setTimeout(() => {
      window.dispatchEvent(new Event("placementOpenModal"));
    }, delay);
  }

  showLoseModal() {
    document.body.classList.add("is--modal-open");
    const loseModal = document.getElementById("modal-lose");
    loseModal.classList.add("is--active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new ChickenRoadGame();
  game.initGame();
});
