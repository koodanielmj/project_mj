const sampleBooks = [
  { id:"B001", title:"구름 위의 비밀 도서관", author:"어린이 작가 1", grade:"전 학년", description:"구름 위에서 발견한 신비한 도서관과 책을 사랑하는 친구들의 모험 이야기예요.", emoji:"☁️", color:"#dcefff" },
  { id:"B002", title:"용감한 민들레", author:"어린이 작가 2", grade:"1~3학년", description:"작지만 씩씩한 민들레가 바람을 타고 새로운 친구를 만나는 이야기예요.", emoji:"🌼", color:"#fff0b8" },
  { id:"B003", title:"우리 반 우주 탐험대", author:"어린이 작가 3", grade:"3~6학년", description:"교실에서 출발한 우주선과 친구들이 펼치는 즐거운 우주 탐험기예요.", emoji:"🚀", color:"#e5ddff" },
  { id:"B004", title:"고양이 탐정의 하루", author:"어린이 작가 4", grade:"전 학년", description:"학교에서 사라진 연필을 찾아 나선 고양이 탐정의 유쾌한 추리 이야기예요.", emoji:"🐈", color:"#ffe0d6" },
  { id:"B005", title:"바다를 지키는 작은 손", author:"어린이 작가 5", grade:"2~6학년", description:"친구들이 힘을 합쳐 깨끗한 바다를 만드는 따뜻한 환경 이야기예요.", emoji:"🐳", color:"#d9f5f2" },
  { id:"B006", title:"내 마음의 무지개", author:"어린이 작가 6", grade:"전 학년", description:"여러 가지 감정을 색깔로 만나고 마음을 표현하는 방법을 알아보는 책이에요.", emoji:"🌈", color:"#f8e0f1" }
];

const stateKey = "bingo-bookstore-loans-v1";
let books = [];
let filter = "all";
let query = "";
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value="") => value.replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const loans = () => JSON.parse(localStorage.getItem(stateKey) || "{}");
const saveLoans = (value) => localStorage.setItem(stateKey, JSON.stringify(value));
const isBorrowed = (id) => Boolean(loans()[id]);

async function loadBooks() {
  try { const response = await fetch("./books.json", { cache:"no-store" }); books = response.ok ? await response.json() : sampleBooks; }
  catch { books = sampleBooks; }
  renderBooks();
}

function coverMarkup(book, className="cover") {
  const image = book.cover ? `<img src="${escapeHtml(book.cover)}" alt="${escapeHtml(book.title)} 표지" />` : escapeHtml(book.emoji || "📖");
  return `<div class="${className}" style="--cover:${escapeHtml(book.color || "#e8f5ef")}">${image}</div>`;
}

function renderBooks() {
  const visible = books.filter((book) => {
    const matchesQuery = `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase());
    const borrowed = isBorrowed(book.id);
    return matchesQuery && (filter === "all" || (filter === "borrowed" ? borrowed : !borrowed));
  });
  $("#bookCount").textContent = `총 ${books.length}권의 책`;
  $("#bookGrid").innerHTML = visible.map((book) => {
    const borrowed = isBorrowed(book.id);
    return `<button class="book-card" type="button" data-book-id="${escapeHtml(book.id)}">
      <span class="book-id">${escapeHtml(book.id)}</span>${coverMarkup(book)}
      <span class="card-body"><span class="status ${borrowed ? "borrowed" : ""}">${borrowed ? "대여 중" : "대여 가능"}</span><h3>${escapeHtml(book.title)}</h3><p class="author">${escapeHtml(book.author)}</p></span>
    </button>`;
  }).join("");
  $("#emptyState").hidden = visible.length > 0;
  document.querySelectorAll("[data-book-id]").forEach((button) => button.addEventListener("click", () => openBook(button.dataset.bookId)));
}

function openBook(id) {
  const book = books.find((item) => item.id === id); if (!book) return;
  const borrowed = isBorrowed(id);
  $("#bookDialogContent").innerHTML = `<article class="book-detail">${coverMarkup(book,"detail-cover")}<div class="detail-content">
    <button class="icon-button" type="button" data-close="bookDialog" aria-label="닫기">×</button>
    <span class="status ${borrowed ? "borrowed" : ""}">${borrowed ? "대여 중" : "대여 가능"}</span>
    <h2>${escapeHtml(book.title)}</h2><p class="author">${escapeHtml(book.author)}</p><p class="detail-description">${escapeHtml(book.description)}</p>
    <div class="detail-meta"><div><small>책 번호</small><strong>${escapeHtml(book.id)}</strong></div><div><small>추천 학년</small><strong>${escapeHtml(book.grade)}</strong></div></div>
    <button class="primary-button" id="borrowButton" type="button" ${borrowed ? "disabled" : ""}>${borrowed ? "지금은 대여 중이에요" : "이 책 대여하기"}</button>
  </div></article>`;
  $("#bookDialog").showModal();
  $("#bookDialogContent [data-close]").addEventListener("click", () => $("#bookDialog").close());
  if (!borrowed) $("#borrowButton").addEventListener("click", () => borrowBook(id));
}

function borrowBook(id) {
  const book = books.find((item) => item.id === id);
  if (!confirm(`‘${book.title}’을(를) 대여할까요?`)) return;
  const current = loans(); current[id] = { borrowedAt:new Date().toISOString() }; saveLoans(current);
  $("#bookDialog").close(); renderBooks(); showToast("대여가 완료되었어요! 책 번호를 확인해 주세요.");
}

function renderManagement() {
  const borrowedBooks = books.filter((book) => isBorrowed(book.id));
  $("#borrowedList").innerHTML = borrowedBooks.length ? borrowedBooks.map((book) => `<div class="loan-row"><div><strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(book.id)} · ${escapeHtml(book.author)}</small></div><button class="return-button" data-return-id="${escapeHtml(book.id)}" type="button">반납 처리</button></div>`).join("") : `<div class="all-available">현재 대여 중인 책이 없어요.</div>`;
  document.querySelectorAll("[data-return-id]").forEach((button) => button.addEventListener("click", () => returnBook(button.dataset.returnId)));
}

function returnBook(id) { const current = loans(); delete current[id]; saveLoans(current); renderManagement(); renderBooks(); showToast("반납 처리가 완료되었어요."); }
function showToast(message) { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove("show"),2800); }

$("#searchInput").addEventListener("input", (event) => { query=event.target.value.trim(); renderBooks(); });
document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".filter").forEach((item)=>item.classList.remove("active")); button.classList.add("active"); filter=button.dataset.filter; renderBooks(); }));
$("#manageButton").addEventListener("click", () => { renderManagement(); $("#manageDialog").showModal(); });
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
$("#resetAllButton").addEventListener("click", () => { if (confirm("모든 책을 ‘대여 가능’으로 바꿀까요?")) { saveLoans({}); renderManagement(); renderBooks(); showToast("모든 대여 상태를 초기화했어요."); } });
["bookDialog","manageDialog"].forEach((id) => document.getElementById(id).addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }));
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
loadBooks();
