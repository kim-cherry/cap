// ==UserScript==
// @name         크랙 채팅 발췌 확장 프로그램
// @namespace    https://share.crack.wrtn.ai/l7pyro
// @version      1.0
// @description  채팅 내에서 마음에 드는 구간을 드래그하면 카드 이미지로 발췌해주는 유저스크립트
// @author       김벚꽃
// @match        https://crack.wrtn.ai/*
// @require      https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/dist/html-to-image.min.js
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";

  // 1. 스타일 삽입 (모달 및 토글 UI용)
  GM_addStyle(`
        .wrtn-quote-modal-backdrop {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(4px);
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        .wrtn-quote-modal-backdrop.active {
            opacity: 1;
            pointer-events: auto;
        }
        .wrtn-quote-modal {
            background: #111;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            display: flex;
            flex-direction: row;
            overflow: hidden;
            width: 90%;
            max-width: 1000px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
            transform: translateY(20px) scale(0.95);
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .wrtn-quote-modal-backdrop.active .wrtn-quote-modal {
            transform: translateY(0) scale(1);
        }
        .wrtn-quote-preview-area {
            flex: 1;
            background: #000;
            padding: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .wrtn-quote-card {
            width: 100%;
            max-width: 400px;
            aspect-ratio: 1 / 1;
            border-radius: 8px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 2rem;
            box-sizing: border-box;
            background: linear-gradient(to bottom right, #1a2a6c, #11998e, #2bc0e4);
            box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            overflow: hidden;
        }
        .wrtn-quote-card-overlay {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.3);
            backdrop-filter: blur(2px);
            z-index: 1;
        }
        .wrtn-quote-card-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        .wrtn-quote-text {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-family: 'Noto Serif KR', ui-serif, Georgia, serif;
            font-size: 1.5rem;
            line-height: 1.4;
            white-space: pre-wrap;
            text-align: center;
            word-break: keep-all;
            width: 100%;
            overflow: hidden;
        }
        .wrtn-quote-footer {
            flex-shrink: 0;
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
        }
        .wrtn-quote-divider {
            height: 1px;
            width: 50px;
            background: rgba(255,255,255,0.4);
        }
        .wrtn-quote-session-name {
            color: rgba(255,255,255,0.8);
            font-size: 0.75rem;
            font-family: 'Inter', sans-serif;
            letter-spacing: normal;
            text-align: center;
            font-weight: 500;
        }

        .wrtn-quote-controls {
            width: 320px;
            background: #1a1a1a;
            border-left: 1px solid rgba(255,255,255,0.1);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            color: #fff;
            font-family: 'Inter', sans-serif;
        }
        .wrtn-quote-controls h3 { margin: 0; font-size: 1.25rem; font-weight: 600; display: flex; justify-content: space-between; align-items: center; }
        .wrtn-quote-close { background: transparent; border: none; color: #888; font-size: 1.5rem; cursor: pointer; }
        .wrtn-quote-close:hover { color: #fff; }

        .wrtn-quote-control-group { display: flex; flex-direction: column; gap: 8px; }
        .wrtn-quote-control-group label { font-size: 0.85rem; color: #aaa; font-weight: 500; }
        .wrtn-quote-buttons { display: flex; gap: 8px; }
        .wrtn-quote-btn { flex: 1; padding: 8px; background: #333; border: 1px solid #444; color: #ccc; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
        .wrtn-quote-btn.active { background: #4f46e5; border-color: #4338ca; color: #fff; }

        .wrtn-quote-gradients { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 8px; }
        .wrtn-quote-gradient-btn { height: 40px; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: transform 0.2s; }
        .wrtn-quote-gradient-btn:hover { transform: scale(1.05); }
        .wrtn-quote-gradient-btn.active { border-color: #fff; }

        .wrtn-quote-slider { width: 100%; -webkit-appearance: none; background: #333; height: 6px; border-radius: 3px; outline: none; margin-top: 8px; transition: background 0.2s; }
        .wrtn-quote-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #4f46e5; cursor: pointer; }
        .wrtn-quote-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #4f46e5; cursor: pointer; border: none; }
        .wrtn-quote-slider-header { display: flex; justify-content: space-between; align-items: center; }

        .wrtn-quote-input { width: 100%; padding: 10px; background: #222; border: 1px solid #444; border-radius: 6px; color: #fff; box-sizing: border-box; }
        .wrtn-quote-file-input { display: none; }
        .wrtn-quote-file-label { display: flex; align-items: center; justify-content: center; height: 80px; border: 2px dashed #444; border-radius: 6px; cursor: pointer; color: #888; font-size: 0.9rem; margin-top: 8px; }
        .wrtn-quote-file-label:hover { border-color: #666; color: #aaa; }

        .wrtn-quote-download-btn { width: 100%; padding: 12px; background: #4f46e5; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; margin-top: auto; transition: background 0.2s; }
        .wrtn-quote-download-btn:hover { background: #4338ca; }

        @media (max-width: 768px) {
            .wrtn-quote-modal { flex-direction: column; max-height: 90vh; overflow-y: auto; }
            .wrtn-quote-controls { width: 100%; border-left: none; border-top: 1px solid rgba(255,255,255,0.1); }
        }
    `);

  // 2. 상태 관리
  let isExtensionOn = false;
  let selectedText = "";
  let currentSessionName = "세션 이름";

  let currentBgType = "gradient";
  let currentGradientIndex = 0;
  let customImageUrl = null;
  let currentFormat = "png";
  let currentAspectRatio = "1/1";
  let currentTextAlign = "center";

  const gradients = [
    "linear-gradient(to bottom right, #1a2a6c, #11998e, #2bc0e4)",
    "linear-gradient(to bottom, #0f2027, #203a43, #2c5364)",
    "linear-gradient(to right, #434343 0%, black 100%)",
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(to bottom, #141e30, #243b55)",
    "linear-gradient(to bottom, #232526, #414345)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)", // Pink
    "linear-gradient(120deg, #f6d365 0%, #fda085 100%)", // Orange/Pink
    "linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)", // White/Silver
    "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)", // Light/White
    "linear-gradient(to right, #ffecd2 0%, #fcb69f 100%)", // Peach/Pink
    "linear-gradient(to top, #a18cd1 0%, #fbc2eb 100%)", // Purple/Pink
  ];

  // 3. UI 생성 (모달)
  const backdrop = document.createElement("div");
  backdrop.id = "wrtn-quote-modal-backdrop";
  backdrop.className = "wrtn-quote-modal-backdrop";
  document.body.appendChild(backdrop);

  backdrop.innerHTML = `
        <div class="wrtn-quote-modal">
            <div class="wrtn-quote-preview-area">
                <div class="wrtn-quote-card" id="wrtn-quote-card-element">
                    <div class="wrtn-quote-card-overlay"></div>
                    <div class="wrtn-quote-card-content">
                        <div class="wrtn-quote-text" id="wrtn-quote-text-display"></div>
                        <div class="wrtn-quote-footer">
                            <div class="wrtn-quote-divider"></div>
                            <div class="wrtn-quote-session-name" id="wrtn-quote-session-display"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="wrtn-quote-controls">
                <h3>설 정 <button class="wrtn-quote-close" id="wrtn-quote-close">&times;</button></h3>

                <div class="wrtn-quote-control-group">
                    <label>배경 스타일</label>
                    <div class="wrtn-quote-buttons">
                        <button class="wrtn-quote-btn active" id="btn-bg-grad">그라데이션</button>
                        <button class="wrtn-quote-btn" id="btn-bg-img">이미지</button>
                    </div>

                    <div class="wrtn-quote-gradients" id="wrtn-gradient-options">
                        ${gradients.map((g, i) => `<button class="wrtn-quote-gradient-btn ${i === 0 ? "active" : ""}" data-index="${i}" style="background: ${g}"></button>`).join("")}
                    </div>

                    <label class="wrtn-quote-file-label" id="wrtn-img-upload-label" style="display:none;">
                        <span id="wrtn-img-upload-text">이미지 업로드</span>
                        <input type="file" accept="image/*" class="wrtn-quote-file-input" id="wrtn-img-input" />
                    </label>
                </div>

                <div class="wrtn-quote-control-group">
                    <label>비율</label>
                    <div class="wrtn-quote-buttons">
                        <button class="wrtn-quote-btn active" id="btn-ratio-1">1 : 1</button>
                        <button class="wrtn-quote-btn" id="btn-ratio-2">2 : 3</button>
                    </div>
                </div>

                <div class="wrtn-quote-control-group">
                    <label>정렬</label>
                    <div class="wrtn-quote-buttons">
                        <button class="wrtn-quote-btn" id="btn-align-left">좌측</button>
                        <button class="wrtn-quote-btn active" id="btn-align-center">중앙</button>
                        <button class="wrtn-quote-btn" id="btn-align-right">우측</button>
                    </div>
                </div>

                <div class="wrtn-quote-control-group">
                    <div class="wrtn-quote-slider-header">
                        <label>글자 크기 조정</label>
                    </div>
                    <input type="range" class="wrtn-quote-slider" id="wrtn-font-size-slider" min="0.8" max="1.8" step="0.05" value="1.5" />
                </div>

                <div class="wrtn-quote-control-group">
                    <label>챗 이름</label>
                    <input type="text" class="wrtn-quote-input" id="wrtn-session-input" />
                </div>

                <div class="wrtn-quote-control-group" style="margin-top: auto; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1);">
                    <div class="wrtn-quote-buttons">
                        <button class="wrtn-quote-btn active" id="btn-fmt-png">PNG</button>
                        <button class="wrtn-quote-btn" id="btn-fmt-webp">WEBP</button>
                    </div>
                    <button class="wrtn-quote-download-btn" id="wrtn-download-btn">이미지 저장🌸</button>
                </div>
            </div>
        </div>
    `;

  // DOM Elements Reference
  const cardEl = document.getElementById("wrtn-quote-card-element");
  const textDisplay = document.getElementById("wrtn-quote-text-display");
  const sessionDisplay = document.getElementById("wrtn-quote-session-display");
  const sessionInput = document.getElementById("wrtn-session-input");
  const btnBgGrad = document.getElementById("btn-bg-grad");
  const btnBgImg = document.getElementById("btn-bg-img");
  const gradOptions = document.getElementById("wrtn-gradient-options");
  const imgUploadLabel = document.getElementById("wrtn-img-upload-label");
  const imgInput = document.getElementById("wrtn-img-input");
  const gradBtns = document.querySelectorAll(".wrtn-quote-gradient-btn");
  const btnFmtPng = document.getElementById("btn-fmt-png");
  const btnFmtWebp = document.getElementById("btn-fmt-webp");
  const fontSizeSlider = document.getElementById("wrtn-font-size-slider");

  const btnRatio1 = document.getElementById("btn-ratio-1");
  const btnRatio2 = document.getElementById("btn-ratio-2");
  const btnAlignLeft = document.getElementById("btn-align-left");
  const btnAlignCenter = document.getElementById("btn-align-center");
  const btnAlignRight = document.getElementById("btn-align-right");

  // UI Update Functions
  function updateCardBackground() {
    if (currentBgType === "gradient") {
      cardEl.style.backgroundImage = gradients[currentGradientIndex];
      cardEl.style.backgroundSize = "auto";
      cardEl.style.backgroundPosition = "auto";
    } else {
      const bg = customImageUrl ? `url(${customImageUrl})` : gradients[0];
      cardEl.style.backgroundImage = bg;
      cardEl.style.backgroundSize = "cover";
      cardEl.style.backgroundPosition = "center";
    }
  }

  function getFontSize(length) {
    if (length < 30) return 1.8;
    if (length < 80) return 1.5;
    if (length < 150) return 1.15;
    return 0.9;
  }

  function openModal() {
    const baseSize = getFontSize(selectedText.length);
    textDisplay.textContent = selectedText;
    textDisplay.style.fontSize = baseSize + "rem";
    fontSizeSlider.value = baseSize;

    sessionDisplay.textContent = currentSessionName;
    sessionInput.value = currentSessionName;
    updateCardBackground();
    backdrop.classList.add("active");
  }

  function closeModal() {
    backdrop.classList.remove("active");

    // 상태 초기화
    customImageUrl = null;
    currentBgType = "gradient";
    document.getElementById("btn-bg-grad").classList.add("active");
    document.getElementById("btn-bg-img").classList.remove("active");
    document.getElementById("wrtn-gradient-options").style.display = "grid";
    document.getElementById("wrtn-img-upload-label").style.display = "none";
    document.getElementById("wrtn-img-upload-text").innerText = "이미지 업로드";
    document.getElementById("wrtn-img-input").value = "";
    updateCardBackground();
  }

  // Event Listeners (Modal)
  document
    .getElementById("wrtn-quote-close")
    .addEventListener("click", closeModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) closeModal();
  });

  sessionInput.addEventListener("input", (e) => {
    currentSessionName = e.target.value;
    sessionDisplay.textContent = currentSessionName;
  });

  // Font size slider toggle
  fontSizeSlider.addEventListener("input", (e) => {
    const size = parseFloat(e.target.value);
    textDisplay.style.fontSize = size + "rem";
  });

  btnRatio1.addEventListener("click", () => {
    currentAspectRatio = "1/1";
    cardEl.style.aspectRatio = "1 / 1";
    btnRatio1.classList.add("active");
    btnRatio2.classList.remove("active");
  });
  btnRatio2.addEventListener("click", () => {
    currentAspectRatio = "2/3";
    cardEl.style.aspectRatio = "2 / 3";
    btnRatio2.classList.add("active");
    btnRatio1.classList.remove("active");
  });

  btnAlignLeft.addEventListener("click", () => {
    currentTextAlign = "left";
    textDisplay.style.textAlign = "left";
    updateAlignBtn("left");
  });
  btnAlignCenter.addEventListener("click", () => {
    currentTextAlign = "center";
    textDisplay.style.textAlign = "center";
    updateAlignBtn("center");
  });
  btnAlignRight.addEventListener("click", () => {
    currentTextAlign = "right";
    textDisplay.style.textAlign = "right";
    updateAlignBtn("right");
  });

  function updateAlignBtn(align) {
    btnAlignLeft.classList.toggle("active", align === "left");
    btnAlignCenter.classList.toggle("active", align === "center");
    btnAlignRight.classList.toggle("active", align === "right");
  }

  // Background type toggles
  btnBgGrad.addEventListener("click", () => {
    currentBgType = "gradient";
    btnBgGrad.classList.add("active");
    btnBgImg.classList.remove("active");
    gradOptions.style.display = "grid";
    imgUploadLabel.style.display = "none";
    updateCardBackground();
  });

  btnBgImg.addEventListener("click", () => {
    currentBgType = "image";
    btnBgImg.classList.add("active");
    btnBgGrad.classList.remove("active");
    gradOptions.style.display = "none";
    imgUploadLabel.style.display = "flex";
    updateCardBackground();
  });

  gradBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      currentGradientIndex = parseInt(e.target.dataset.index);
      gradBtns.forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      updateCardBackground();
    });
  });

  imgInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        customImageUrl = event.target.result;
        updateCardBackground();
        document.getElementById("wrtn-img-upload-text").innerText =
          "이미지 변경";
        e.target.value = ""; // 동일 이미지 재업로드 가능하도록 input 초기화
      };
      reader.readAsDataURL(file);
    }
  });

  // Format toggles
  btnFmtPng.addEventListener("click", () => {
    currentFormat = "png";
    btnFmtPng.classList.add("active");
    btnFmtWebp.classList.remove("active");
  });
  btnFmtWebp.addEventListener("click", () => {
    currentFormat = "webp";
    btnFmtWebp.classList.add("active");
    btnFmtPng.classList.remove("active");
  });

  // Download
  document
    .getElementById("wrtn-download-btn")
    .addEventListener("click", async () => {
      if (!window.htmlToImage) {
        alert("html-to-image 라이브러리가 로드되지 않았습니다.");
        return;
      }

      try {
        const btn = document.getElementById("wrtn-download-btn");
        btn.innerText = "저장 중...";

        let dataUrl;
        if (currentFormat === "webp") {
          const canvas = await window.htmlToImage.toCanvas(cardEl, {
            pixelRatio: 3,
          });
          dataUrl = canvas.toDataURL("image/webp", 0.95);
        } else {
          dataUrl = await window.htmlToImage.toPng(cardEl, { pixelRatio: 3 });
        }

        const link = document.createElement("a");
        link.download = `wrtn-quote.${currentFormat}`;
        link.href = dataUrl;
        link.click();
        btn.innerText = "이미지 저장";
      } catch (err) {
        console.error(err);
        alert("이미지 저장 실패");
      }
    });

  // 4. 세션 이름 추출 함수
  function extractSessionName() {
    // user provided selector: <button type="button" class="typo-text-base_leading-none_medium text-primary flex items-center space-x-[6px]"><span class="line-clamp-1 text-ellipsis">아르카：디 아포칼립스 S</span>...
    const nameSpan = document.querySelector(
      "button > span.line-clamp-1.text-ellipsis",
    );
    if (nameSpan && nameSpan.innerText) {
      return nameSpan.innerText.trim();
    }
    return "알 수 없는 세션";
  }

  // 5. 사이드바 메뉴 렌더링 감지 및 토글 추가 (Mutation Observer)
  function injectToggle() {
    // 이미 주입되었는지 확인
    if (document.getElementById("wrtn-quote-sidebar-toggle")) return;

    // "전체 설정" 텍스트를 가진 p 태그 찾기
    const pTags = document.querySelectorAll(
      "p.text-text_tertiary, p.typo-text-sm_leading-none_medium",
    );
    let targetP = null;
    for (const p of pTags) {
      if (p.innerText.includes("전체 설정")) {
        targetP = p;
        break;
      }
    }

    if (targetP) {
      console.log("Found 전체 설정, injecting toggle...");

      // p 태그 뒤에 넣기 위한 생성
      const wrapper = document.createElement("div");
      wrapper.className = "px-2.5 h-4 box-content py-[18px]";
      wrapper.id = "wrtn-quote-sidebar-toggle";

      const state = isExtensionOn ? "checked" : "unchecked";
      const translate = isExtensionOn ? "15px" : "-1px";
      const styleArgs = isExtensionOn
        ? 'style="background-color: #ff4432; border-color: #ff4432;"'
        : "";

      // "상황 이미지 보기"와 비슷한 구조로 생성
      wrapper.innerHTML = `
            <div role="button" tabindex="0" class="w-full flex h-4 items-center justify-between typo-text-base_leading-none_medium space-x-2 [&_svg]:fill-icon_tertiary ring-offset-4 ring-offset-sidebar cursor-pointer">
                <span class="flex space-x-2 items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="var(--icon_secondary)" viewBox="0 0 24 24" width="24" height="24" color="icon_secondary">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                    <span class="whitespace-nowrap overflow-hidden text-ellipsis typo-text-sm_leading-none_medium">이미지로 저장하기</span>
                </span>
                <span>
                    <button id="wrtn-toggle-btn-ui" type="button" role="switch" aria-checked="${isExtensionOn}" data-state="${state}" class="peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors border data-[state=unchecked]:border-bg-input-80 data-[state=unchecked]:bg-bg-input-80 data-[state=checked]:border-primary data-[state=checked]:bg-primary focus-visible:border-focus focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50" ${styleArgs}>
                        <span id="wrtn-toggle-thumb-ui" data-state="${state}" class="pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-[15px] data-[state=unchecked]:translate-x-[-1px]" style="transform: translateX(${translate})"></span>
                    </button>
                </span>
            </div>
            `;

      // "전체 설정" P 태그 다음에 바로 삽입
      targetP.parentNode.insertBefore(wrapper, targetP.nextSibling);

      // 이벤트 리스너 바인딩
      const toggleDiv = wrapper.querySelector('div[role="button"]');
      const toggleBtn = document.getElementById("wrtn-toggle-btn-ui");
      const toggleThumb = document.getElementById("wrtn-toggle-thumb-ui");

      toggleDiv.addEventListener("click", () => {
        isExtensionOn = !isExtensionOn;
        const state = isExtensionOn ? "checked" : "unchecked";
        toggleBtn.setAttribute("data-state", state);
        toggleBtn.setAttribute("aria-checked", isExtensionOn.toString());
        toggleThumb.setAttribute("data-state", state);

        // 수동으로 색상을 변경 (기본 wrtn 클래스 의존성을 줄이기 위해 inline style도 약간 사용)
        if (isExtensionOn) {
          toggleBtn.style.backgroundColor = "#ff4432"; // primary
          toggleBtn.style.borderColor = "#ff4432";
          toggleThumb.style.transform = "translateX(15px)";
        } else {
          toggleBtn.style.backgroundColor = "";
          toggleBtn.style.borderColor = "";
          toggleThumb.style.transform = "translateX(-1px)";
        }
      });
    }
  }

  // DOM 변화를 감지하여 우측 메뉴가 렌더링 될때 UI 삽입
  const observer = new MutationObserver((mutations) => {
    injectToggle();
  });

  // 바디 전체 감시 (우측 패널이 동적으로 생길 수 있으므로)
  observer.observe(document.body, { childList: true, subtree: true });

  // 6. 플로팅 액션 버튼 (Tooltip) 생성
  const tooltipBtn = document.createElement("button");
  tooltipBtn.id = "wrtn-quote-tooltip-btn";
  tooltipBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
      </svg>
      <span>발췌 이미지 만들기</span>
  `;
  tooltipBtn.style.cssText = `
      position: fixed;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background-color: #4f46e5;
      color: white;
      padding: 12px 24px;
      border-radius: 9999px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border: none;
      display: none;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      font-size: 15px;
      cursor: pointer;
      pointer-events: auto;
      transition: background-color 0.2s, transform 0.1s;
  `;
  tooltipBtn.onmouseover = () => {
    tooltipBtn.style.backgroundColor = "#4338ca";
  };
  tooltipBtn.onmouseout = () => {
    tooltipBtn.style.backgroundColor = "#4f46e5";
  };
  tooltipBtn.onmousedown = () => {
    tooltipBtn.style.transform = "translateX(-50%) scale(0.95)";
  };
  tooltipBtn.onmouseup = () => {
    tooltipBtn.style.transform = "translateX(-50%) scale(1)";
  };

  document.body.appendChild(tooltipBtn);

  let tempSelectedText = "";

  tooltipBtn.addEventListener("click", () => {
    if (tempSelectedText) {
      selectedText = tempSelectedText;
      currentSessionName = extractSessionName();

      tooltipBtn.style.display = "none";
      // 모달 띄우기
      openModal();

      // 선택 해제
      window.getSelection()?.removeAllRanges();
    }
  });

  // 7. 텍스트 드래그(선택) 마우스/터치 이벤트
  const handleSelection = () => {
    if (!isExtensionOn) {
      if (tooltipBtn.style.display !== "none")
        tooltipBtn.style.display = "none";
      return;
    }

    // 모달이 열려있는 상태라면 드래그 이벤트를 무시합니다.
    const backdropElement = document.getElementById(
      "wrtn-quote-modal-backdrop",
    );
    if (backdropElement && backdropElement.classList.contains("active")) {
      if (tooltipBtn.style.display !== "none")
        tooltipBtn.style.display = "none";
      return;
    }

    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      tempSelectedText = selection.toString().trim();
      tooltipBtn.style.display = "flex";
    } else {
      tempSelectedText = "";
      tooltipBtn.style.display = "none";
    }
  };

  document.addEventListener("selectionchange", handleSelection);
})();