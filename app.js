const SUPABASE_URL = "https://jhmvkanvykbjolbelpit.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_uMmfpqPIzOC-QkLEksO2qg_9Ot-dj4_";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let books = [];
let session = null;
let filter = "all";
let query = "";
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = "") => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
const isBorrowed = (book) => book.status === "borrowed";

function setSyncStatus(message, state = "") {
  const element = $("#syncStatus");
  element.textContent = message;
  element.className = `sync-status ${state}`.trim();
}

function updateAuthUi() {
  $("#manageButton").textContent = session ? "대여 관리" : "운영자 로그인";
}

async function loadBooks() {
  setSyncStatus("연결 중…");
  const { data, error } = await db.from("books").select("*").order("id");
  if (error) {
    setSyncStatus("연결 오류", "offline");
    $("#bookGrid").innerHTML = `<div class="connection-error"><strong>책 목록을 불러오지 못했습니다.</strong><br />잠시 후 화면을 새로고침해 주세요.</div>`;
    console.error(error);
    return;
  }
  books = data;
  setSyncStatus("실시간 연결", "online");
  renderBooks();
}

function coverMarkup(book, className = "cover") {
  const image = book.cover_url ? `<img src="${escapeHtml(book.cover_url)}" alt="${escapeHtml(book.title)} 표지" />` : escapeHtml(book.emoji || "📖");
  return `<div class="${className}" style="--cover:${escapeHtml(book.color || "#e8f5ef")}">${image}</div>`;
}

function renderBooks() {
  const visible = books.filter((book) => {
    const matchesQuery = `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase());
    const borrowed = isBorrowed(book);
    return matchesQuery && (filter === "all" || (filter === "borrowed" ? borrowed : !borrowed));
  });
  $("#bookCount").textContent = `총 ${books.length}권의 책`;
  $("#bookGrid").innerHTML = visible.map((book) => {
    const borrowed = isBorrowed(book);
    return `<button class="book-card" type="button" data-book-id="${escapeHtml(book.id)}">
      <span class="book-id">${escapeHtml(book.id)}</span>${coverMarkup(book)}
      <span class="card-body"><span class="status ${borrowed ? "borrowed" : ""}">${borrowed ? "대여 중" : "대여 가능"}</span><h3>${escapeHtml(book.title)}</h3><p class="author">${escapeHtml(book.author)}</p></span>
    </button>`;
  }).join("");
  $("#emptyState").hidden = visible.length > 0;
  document.querySelectorAll("[data-book-id]").forEach((button) => button.addEventListener("click", () => openBook(button.dataset.bookId)));
}

function openBook(id) {
  const book = books.find((item) => item.id === id);
  if (!book) return;
  const borrowed = isBorrowed(book);
  const actionLabel = borrowed ? "지금은 대여 중이에요" : (session ? "이 책 대여하기" : "운영자 로그인 후 대여 가능");
  $("#bookDialogContent").innerHTML = `<article class="book-detail">${coverMarkup(book,"detail-cover")}<div class="detail-content">
    <button class="icon-button" type="button" data-close="bookDialog" aria-label="닫기">×</button>
    <span class="status ${borrowed ? "borrowed" : ""}">${borrowed ? "대여 중" : "대여 가능"}</span>
    <h2>${escapeHtml(book.title)}</h2><p class="author">${escapeHtml(book.author)}</p><p class="detail-description">${escapeHtml(book.description)}</p>
    <div class="detail-meta"><div><small>책 번호</small><strong>${escapeHtml(book.id)}</strong></div><div><small>추천 학년</small><strong>${escapeHtml(book.grade)}</strong></div></div>
    <button class="primary-button" id="borrowButton" type="button" ${borrowed || !session ? "disabled" : ""}>${actionLabel}</button>
  </div></article>`;
  $("#bookDialog").showModal();
  $("#bookDialogContent [data-close]").addEventListener("click", () => $("#bookDialog").close());
  if (!borrowed && session) $("#borrowButton").addEventListener("click", () => borrowBook(id));
}

async function updateBookStatus(id, status) {
  const { error } = await db.from("books").update({ status, borrowed_at: status === "borrowed" ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

async function borrowBook(id) {
  const book = books.find((item) => item.id === id);
  if (!confirm(`‘${book.title}’을(를) 대여할까요?`)) return;
  try {
    await updateBookStatus(id, "borrowed");
    $("#bookDialog").close();
    showToast("대여가 완료되었어요! 책 번호를 확인해 주세요.");
  } catch (error) { showToast("대여 처리에 실패했습니다. 다시 시도해 주세요."); console.error(error); }
}

function renderManagement() {
  const borrowedBooks = books.filter(isBorrowed);
  $("#borrowedList").innerHTML = borrowedBooks.length ? borrowedBooks.map((book) => `<div class="loan-row"><div><strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(book.id)} · ${escapeHtml(book.author)}</small></div><button class="return-button" data-return-id="${escapeHtml(book.id)}" type="button">반납 처리</button></div>`).join("") : `<div class="all-available">현재 대여 중인 책이 없어요.</div>`;
  document.querySelectorAll("[data-return-id]").forEach((button) => button.addEventListener("click", () => returnBook(button.dataset.returnId)));
  $("#bookAdminList").innerHTML = books.map((book) => `<div class="loan-row"><div><strong>${escapeHtml(book.title)}</strong><small>${escapeHtml(book.id)} · ${escapeHtml(book.author)}</small></div><button class="delete-button" data-delete-id="${escapeHtml(book.id)}" type="button">삭제</button></div>`).join("");
  document.querySelectorAll("[data-delete-id]").forEach((button) => button.addEventListener("click", () => deleteBook(button.dataset.deleteId)));
}

async function returnBook(id) {
  try { await updateBookStatus(id, "available"); showToast("반납 처리가 완료되었어요."); }
  catch (error) { showToast("반납 처리에 실패했습니다."); console.error(error); }
}

function nextBookId() {
  const max = books.reduce((value, book) => Math.max(value, Number(String(book.id).replace(/\D/g, "")) || 0), 0);
  return `B${String(max + 1).padStart(3, "0")}`;
}

async function addBook(event) {
  event.preventDefault();
  const file = $("#bookCover").files[0];
  const title = $("#bookTitle").value.trim();
  const author = $("#bookAuthor").value.trim();
  const errorElement = $("#addBookError");
  const button = $("#addBookButton");
  errorElement.textContent = "";
  if (!file || !title || !author) { errorElement.textContent = "사진, 책 이름, 작가를 모두 입력해 주세요."; return; }
  if (file.size > 5 * 1024 * 1024) { errorElement.textContent = "사진은 5MB 이하만 등록할 수 있습니다."; return; }

  button.disabled = true;
  button.textContent = "추가 중…";
  const id = nextBookId();
  const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
  const objectPath = `${id}-${crypto.randomUUID()}.${extension}`;

  try {
    const { error: uploadError } = await db.storage.from("book-covers").upload(objectPath, file, { cacheControl:"3600", upsert:false });
    if (uploadError) throw uploadError;
    const { data: publicData } = db.storage.from("book-covers").getPublicUrl(objectPath);
    const { error: insertError } = await db.from("books").insert({ id, title, author, cover_url:publicData.publicUrl, grade:"전 학년", description:"" });
    if (insertError) {
      await db.storage.from("book-covers").remove([objectPath]);
      throw insertError;
    }
    $("#addBookForm").reset();
    showToast(`‘${title}’ 책을 추가했습니다.`);
  } catch (error) {
    errorElement.textContent = "책을 추가하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    console.error(error);
  } finally {
    button.disabled = false;
    button.textContent = "책 추가하기";
  }
}

function coverObjectPath(url) {
  const marker = "/storage/v1/object/public/book-covers/";
  return url?.includes(marker) ? decodeURIComponent(url.split(marker)[1]) : null;
}

async function deleteBook(id) {
  const book = books.find((item) => item.id === id);
  if (!book || !confirm(`‘${book.title}’을(를) 목록에서 삭제할까요?`)) return;
  try {
    const { error } = await db.from("books").delete().eq("id", id);
    if (error) throw error;
    const objectPath = coverObjectPath(book.cover_url);
    if (objectPath) await db.storage.from("book-covers").remove([objectPath]);
    showToast(`‘${book.title}’ 책을 삭제했습니다.`);
  } catch (error) { showToast("책을 삭제하지 못했습니다."); console.error(error); }
}

async function login(event) {
  event.preventDefault();
  const button = $("#loginButton");
  button.disabled = true;
  $("#loginError").textContent = "";
  const { error } = await db.auth.signInWithPassword({ email: $("#loginEmail").value.trim(), password: $("#loginPassword").value });
  button.disabled = false;
  if (error) { $("#loginError").textContent = "이메일 또는 비밀번호를 확인해 주세요."; return; }
  $("#loginPassword").value = "";
  $("#loginDialog").close();
  showToast("운영자로 로그인했습니다.");
}

async function logout() {
  await db.auth.signOut();
  $("#manageDialog").close();
  showToast("로그아웃했습니다.");
}

function showToast(message) {
  const toast = $("#toast"); toast.textContent = message; toast.classList.add("show");
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove("show"), 2800);
}

$("#searchInput").addEventListener("input", (event) => { query = event.target.value.trim(); renderBooks(); });
document.querySelectorAll(".filter").forEach((button) => button.addEventListener("click", () => { document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active")); button.classList.add("active"); filter = button.dataset.filter; renderBooks(); }));
$("#manageButton").addEventListener("click", () => { if (!session) { $("#loginDialog").showModal(); return; } renderManagement(); $("#manageDialog").showModal(); });
$("#loginForm").addEventListener("submit", login);
$("#addBookForm").addEventListener("submit", addBook);
$("#logoutButton").addEventListener("click", logout);
$("#resetAllButton").addEventListener("click", async () => { if (!confirm("모든 책을 ‘대여 가능’으로 바꿀까요?")) return; const { error } = await db.from("books").update({ status:"available", borrowed_at:null, updated_at:new Date().toISOString() }).eq("status", "borrowed"); showToast(error ? "초기화에 실패했습니다." : "모든 대여 상태를 초기화했어요."); });
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close).close()));
["bookDialog","manageDialog","loginDialog"].forEach((id) => document.getElementById(id).addEventListener("click", (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }));

$("#fullscreenButton").addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    else await document.exitFullscreen();
  } catch { showToast("이 브라우저에서는 전체화면을 사용할 수 없습니다."); }
});
document.addEventListener("fullscreenchange", () => { $("#fullscreenButton").textContent = document.fullscreenElement ? "전체화면 종료" : "전체화면"; });

db.auth.onAuthStateChange((_event, nextSession) => { session = nextSession; updateAuthUi(); renderBooks(); });
db.channel("books-status").on("postgres_changes", { event:"*", schema:"public", table:"books" }, async () => { await loadBooks(); if ($("#manageDialog").open) renderManagement(); }).subscribe((status) => { if (status === "SUBSCRIBED") setSyncStatus("실시간 연결", "online"); });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));

loadBooks();
