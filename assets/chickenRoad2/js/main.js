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
    this.modalLose = document.getElementById("modal-lose");
    this.controls = document.getElementById("game-controls");
    this.balance = document.getElementById("balance");
    this.modalBalance = document.getElementById("modal-balance");
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

    // Валюта и язык
    this.currency = "€";
    this.lang = "EU"; // дефолт

    // Переводы
    this.translations = {
      US: {
        countries: ["US", "CA", "AU"], // долларовые страны
        currency: "$",
        play: "Play",
        cashOut: "Cash Out",
        join: "Join Real Game",
        balance: "Balance",
        win: "You win!",
        lose: "You lost!",
        bonus: "Register and get your personal bonus",
        difficulty: "Difficulty",
        chance: "Chance of being shot down",
        levels: ["Easy", "Medium", "Hard", "Hardcore"],
      },
      GB: {
        countries: ["GB", "IE", "NZ"], // фунтовые страны
        currency: "£",
        play: "Spin",
        cashOut: "Withdraw",
        join: "Join Real Game",
        balance: "Balance",
        win: "You win!",
        lose: "You lost!",
        bonus: "Register and get your personal bonus",
        difficulty: "Difficulty",
        chance: "Chance of being shot down",
        levels: ["Easy", "Medium", "Hard", "Hardcore"],
      },
      EU: {
        countries: ["DE", "FR", "ES"], // еврозона (дефолт)
        currency: "€",
        play: "Play",
        cashOut: "Cash Out",
        join: "Join Real Game",
        balance: "Balance",
        win: "You win!",
        lose: "You lost!",
        bonus: "Register and get your personal bonus",
        difficulty: "Difficulty",
        chance: "Chance of being shot down",
        levels: ["Easy", "Medium", "Hard", "Hardcore"],
      },
    };
  }

  async detectCurrency() {
    try {
      const res = await fetch("https://ipapi.co/json/");
      const data = await res.json();
      const countryCode = (data.country_code || "").toUpperCase();

      console.log("Определён код страны:", countryCode);

      // определяем язык/валюту
      if (this.translations.US.countries.includes(countryCode)) {
        this.lang = "US";
      } else if (this.translations.GB.countries.includes(countryCode)) {
        this.lang = "GB";
      } else {
        this.lang = "EU"; // по умолчанию евро
      }

      this.applyTranslations();
    } catch (err) {
      console.error("Ошибка получения IP:", err);
      this.applyTranslations(); // fallback
    }
  }

  applyTranslations() {
    const t = this.translations[this.lang];
    this.currency = t.currency;

    // Кнопки
    if (this.spinButton) {
      const span = this.spinButton.querySelector("#go-btn-default-text");
      if (span) span.textContent = t.play;
    }
    if (this.cashButton) {
      const span = this.cashButton.querySelector("span");
      if (span) span.textContent = t.cashOut;
    }
    if (this.winButton) {
      const span = this.winButton.querySelector("span");
      if (span) span.textContent = t.join;
    }

    // Тексты в модалках
    const winModalTitle = document.querySelector("#modal .modal__title span");
    if (winModalTitle) winModalTitle.textContent = t.win;

    const loseModalTitle = document.querySelector(
      "#modal-lose .modal__title span"
    );
    if (loseModalTitle) loseModalTitle.textContent = t.lose;

    // Валюта
    document.querySelectorAll(".modal__balance-currency").forEach((el) => {
      el.textContent = this.currency;
    });
    document
      .querySelectorAll(".game-controls__defaults-item-currency")
      .forEach((el) => {
        el.textContent = this.currency;
      });

    // Бонусный текст
    const bonusBlocks = document.querySelectorAll(
      "#modal .modal__balance, #modal-lose .modal__balance"
    );
    bonusBlocks.forEach((block) => {
      const spans = block.querySelectorAll("span");
      if (
        spans.length === 1 &&
        !spans[0].id &&
        !spans[0].classList.contains("modal__balance-currency")
      ) {
        spans[0].textContent = t.bonus;
      }
    });

    // Difficulty блок
    const diff = document.querySelector(".game-controls__headings-dif");
    if (diff) diff.textContent = t.difficulty;

    const chance = document.querySelector(".game-controls__headings-chance");
    if (chance) chance.textContent = t.chance;

    const levels = document.querySelectorAll(".game-controls__switcher-item");
    levels.forEach((el, i) => {
      if (t.levels[i]) el.textContent = t.levels[i];
    });

    // Баланс в кнопке Cash Out (чтобы был $/€/£)
    const cashBtnInner = document.querySelector(
      "#cash-btn .game-controls__cash-btn-inner"
    );
    if (cashBtnInner) {
      const balanceSpan = cashBtnInner.querySelector("#balance");
      if (balanceSpan && balanceSpan.nextSibling) {
        balanceSpan.nextSibling.textContent = " " + this.currency;
      }
    }
  }

  initGame() {
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
      this.disableControls(10000);
    });
  }

  // ==== остальной код игры без изменений ====
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

    if (
      this.isDesktop &&
      (this.currentStep === this.firstStepIndex ||
        this.currentStep === this.lastStepIndex ||
        this.spaceScrolled > this.field.offsetWidth)
    ) {
      this.charMoves += 1;
    }

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
    if (sector) sector.classList.add("is--next");
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
    const newBalance = (this.rate * multiplier).toFixed(2);
    this.balance.innerText = newBalance;
    this.modalBalance.innerText = newBalance;
  }

  updateMultiplier(step) {
    const idx = Math.max(0, step - 1);
    const currentMultiplier = this.multipliers[idx] || 1;
    this.modalMultiplier.innerText = currentMultiplier;
    this.charMultiplier.innerText = currentMultiplier;
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

  triggerShowModal(delay = 0) {
    setTimeout(() => {
      window.dispatchEvent(new Event("placementOpenModal"));
    }, delay);
  }

  showLoseModal() {
    document.body.classList.add("is--modal-open");
    this.modalLose.classList.add("is--active");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const game = new ChickenRoadGame();
  game.initGame();
});
