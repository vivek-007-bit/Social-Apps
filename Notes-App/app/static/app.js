"use strict";

// DOM elements
const newNoteButton = document.getElementById("new-note-button");
const emptyNewNoteButton = document.getElementById("empty-new-note-button");
const mobileBackButton = document.getElementById("mobile-back-button");

const editNoteButton = document.getElementById("edit-note-button");
const saveNoteButton = document.getElementById("save-note-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const deleteNoteButton = document.getElementById("delete-note-button");

const exportNoteButton = document.getElementById("export-note-button");
const exportMenu = document.getElementById("export-menu");
const exportTxtButton = document.getElementById("export-txt-button");
const exportImageButton = document.getElementById("export-image-button");

const searchInput = document.getElementById("search-input");
const notesList = document.getElementById("notes-list");
const noteCount = document.getElementById("note-count");

const editorStatus = document.getElementById("editor-status");
const editorEmpty = document.getElementById("editor-empty");
const noteEditor = document.getElementById("note-editor");

const noteTitle = document.getElementById("note-title");
const noteContent = document.getElementById("note-content");
const noteMeta = document.getElementById("note-meta");

const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

// State
const STORAGE_KEY = "notes-app-notes";

let notes = [];
let selectedNoteId = null;
let isEditing = false;
let isCreatingNewNote = false;
let originalTitle = "";
let originalContent = "";
let toastTimer = null;

// Local storage
function loadNotes() {
    try {
        const storedNotes = localStorage.getItem(STORAGE_KEY);

        if (!storedNotes) {
            notes = [];
            return;
        }

        const parsedNotes = JSON.parse(storedNotes);

        if (!Array.isArray(parsedNotes)) {
            notes = [];
            return;
        }

        notes = parsedNotes;
    } catch (error) {
        console.error("Unable to load notes:", error);
        notes = [];
        showToast("Unable to load saved notes.", "error");
    }
}

function saveNotes() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(notes)
        );

        return true;
    } catch (error) {
        console.error("Unable to save notes:", error);
        showToast("Unable to save note.", "error");
        return false;
    }
}

// Helpers
function generateNoteId() {
    return (
        Date.now().toString(36) +
        Math.random().toString(36).substring(2, 8)
    );
}

function getNoteById(noteId) {
    return notes.find((note) => note.id === noteId);
}

function formatDate(timestamp) {
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(timestamp) {
    if (!timestamp) {
        return "";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function getNoteTitle(note) {
    const title =
        typeof note.title === "string"
            ? note.title.trim()
            : "";

    return title || "Untitled Note";
}

function getNotePreview(note) {
    const content =
        typeof note.content === "string"
            ? note.content.trim()
            : "";

    if (!content) {
        return "No content";
    }

    return content
        .replace(/\s+/g, " ")
        .substring(0, 100);
}

// Mobile layout
function updateMobileEditorVisibility() {
    const appShell = document.querySelector(".app-shell");

    if (!appShell) {
        return;
    }

    if (selectedNoteId !== null) {
        appShell.classList.add("mobile-editor-visible");
    } else {
        appShell.classList.remove("mobile-editor-visible");
    }
}

// Toast
function showToast(message, type = "success") {
    clearTimeout(toastTimer);

    toastMessage.textContent = message;

    toast.classList.remove("success", "error");

    if (type === "error") {
        toast.classList.add("error");
    }

    toast.classList.add("show");

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

// Editor mode
function setEditorMode(editing) {
    isEditing = editing;

    noteTitle.readOnly = !editing;
    noteContent.readOnly = !editing;

    editNoteButton.disabled =
        selectedNoteId === null || editing;

    saveNoteButton.disabled =
        selectedNoteId === null || !editing;

    cancelEditButton.disabled =
        selectedNoteId === null || !editing;

    deleteNoteButton.disabled =
        selectedNoteId === null || editing;

    exportNoteButton.disabled =
        selectedNoteId === null || editing;

    if (editing) {
        noteTitle.classList.add("editing");
        noteContent.classList.add("editing");
        editorStatus.textContent = "Editing note";
    } else {
        noteTitle.classList.remove("editing");
        noteContent.classList.remove("editing");

        if (selectedNoteId !== null) {
            editorStatus.textContent = "Viewing note";
        } else {
            editorStatus.textContent = "No note selected";
        }
    }
}

// Create note
function createNote() {
    const now = new Date().toISOString();

    const newNote = {
        id: generateNoteId(),
        title: "",
        content: "",
        createdAt: now,
        updatedAt: now
    };

    notes.unshift(newNote);

    selectedNoteId = newNote.id;
    isCreatingNewNote = true;

    saveNotes();

    originalTitle = "";
    originalContent = "";

    renderNotesList();
    renderEditor();
    setEditorMode(true);
    updateMobileEditorVisibility();

    requestAnimationFrame(() => {
        noteTitle.focus();
    });

    showToast("New note created.");
}

// Select note
function selectNote(noteId) {
    if (selectedNoteId === noteId) {
        return;
    }

    if (isEditing) {
        const shouldDiscard = window.confirm(
            "Discard your unsaved changes?"
        );

        if (!shouldDiscard) {
            return;
        }

        if (isCreatingNewNote) {
            notes = notes.filter(
                (note) => note.id !== selectedNoteId
            );

            saveNotes();
        }
    }

    const note = getNoteById(noteId);

    if (!note) {
        return;
    }

    selectedNoteId = noteId;
    isCreatingNewNote = false;
    isEditing = false;

    originalTitle = note.title || "";
    originalContent = note.content || "";

    renderNotesList();
    renderEditor();
    setEditorMode(false);
    updateMobileEditorVisibility();
}

// Start editing
function startEditing() {
    if (selectedNoteId === null) {
        return;
    }

    const note = getNoteById(selectedNoteId);

    if (!note) {
        return;
    }

    originalTitle = note.title || "";
    originalContent = note.content || "";
    isCreatingNewNote = false;

    setEditorMode(true);

    requestAnimationFrame(() => {
        noteTitle.focus();

        noteTitle.setSelectionRange(
            noteTitle.value.length,
            noteTitle.value.length
        );
    });

    showToast("Edit mode enabled.");
}

// Save note
function saveEditedNote() {
    if (selectedNoteId === null || !isEditing) {
        return;
    }

    const note = getNoteById(selectedNoteId);

    if (!note) {
        return;
    }

    note.title = noteTitle.value.trim();
    note.content = noteContent.value;
    note.updatedAt = new Date().toISOString();

    const saved = saveNotes();

    if (!saved) {
        return;
    }

    originalTitle = note.title;
    originalContent = note.content;
    isCreatingNewNote = false;

    setEditorMode(false);
    renderNotesList();
    renderEditor();
    updateMobileEditorVisibility();

    showToast("Note saved.");
}

// Cancel editing
function cancelEditing() {
    if (selectedNoteId === null || !isEditing) {
        return;
    }

    if (isCreatingNewNote) {
        notes = notes.filter(
            (note) => note.id !== selectedNoteId
        );

        selectedNoteId = null;
        isCreatingNewNote = false;
        originalTitle = "";
        originalContent = "";

        saveNotes();
        closeExportMenu();

        renderNotesList();
        renderEditor();
        setEditorMode(false);
        updateMobileEditorVisibility();

        showToast("New note discarded.");
        return;
    }

    noteTitle.value = originalTitle;
    noteContent.value = originalContent;

    isCreatingNewNote = false;

    setEditorMode(false);
    renderEditor();
    updateMobileEditorVisibility();

    showToast("Changes discarded.");
}

// Delete note
function deleteSelectedNote() {
    if (selectedNoteId === null) {
        return;
    }

    const note = getNoteById(selectedNoteId);

    if (!note) {
        return;
    }

    const title = getNoteTitle(note);

    const confirmed = window.confirm(
        `Delete "${title}"?`
    );

    if (!confirmed) {
        return;
    }

    notes = notes.filter(
        (item) => item.id !== selectedNoteId
    );

    selectedNoteId = null;
    isEditing = false;
    isCreatingNewNote = false;
    originalTitle = "";
    originalContent = "";

    saveNotes();
    closeExportMenu();

    renderNotesList();
    renderEditor();
    setEditorMode(false);
    updateMobileEditorVisibility();

    showToast("Note deleted.");
}

// Return to notes list on mobile
function goBackToNotes() {
    if (isEditing) {
        const shouldDiscard = window.confirm(
            "Discard your unsaved changes?"
        );

        if (!shouldDiscard) {
            return;
        }

        if (isCreatingNewNote) {
            notes = notes.filter(
                (note) => note.id !== selectedNoteId
            );

            saveNotes();
        }
    }

    selectedNoteId = null;
    isEditing = false;
    isCreatingNewNote = false;
    originalTitle = "";
    originalContent = "";

    closeExportMenu();

    renderNotesList();
    renderEditor();
    setEditorMode(false);
    updateMobileEditorVisibility();
}

// Search
function getFilteredNotes() {
    const query = searchInput.value
        .trim()
        .toLowerCase();

    if (!query) {
        return notes;
    }

    return notes.filter((note) => {
        const title =
            typeof note.title === "string"
                ? note.title
                : "";

        const content =
            typeof note.content === "string"
                ? note.content
                : "";

        return (
            title.toLowerCase().includes(query) ||
            content.toLowerCase().includes(query)
        );
    });
}

// Render notes list
function renderNotesList() {
    const filteredNotes = getFilteredNotes();

    notesList.innerHTML = "";

    if (filteredNotes.length === 0) {
        const empty = document.createElement("div");

        empty.className = "empty-notes";

        if (notes.length === 0) {
            empty.textContent =
                "No notes yet. Create your first note.";
        } else {
            empty.textContent =
                "No notes match your search.";
        }

        notesList.appendChild(empty);
    } else {
        filteredNotes.forEach((note) => {
            const button = document.createElement("button");

            button.type = "button";
            button.className = "note-list-item";

            if (note.id === selectedNoteId) {
                button.classList.add("active");
            }

            const title = document.createElement("div");

            title.className = "note-list-title";
            title.textContent = getNoteTitle(note);

            const preview = document.createElement("div");

            preview.className = "note-list-preview";
            preview.textContent = getNotePreview(note);

            const date = document.createElement("div");

            date.className = "note-list-date";
            date.textContent = formatDate(note.updatedAt);

            button.appendChild(title);
            button.appendChild(preview);
            button.appendChild(date);

            button.addEventListener("click", () => {
                selectNote(note.id);
            });

            notesList.appendChild(button);
        });
    }

    const count = notes.length;

    noteCount.textContent =
        `${count} ${count === 1 ? "note" : "notes"}`;
}

// Render editor
function renderEditor() {
    if (selectedNoteId === null) {
        editorEmpty.classList.remove("hidden");
        noteEditor.classList.add("hidden");

        editorStatus.textContent = "No note selected";

        editNoteButton.disabled = true;
        saveNoteButton.disabled = true;
        cancelEditButton.disabled = true;
        deleteNoteButton.disabled = true;
        exportNoteButton.disabled = true;

        closeExportMenu();

        return;
    }

    const note = getNoteById(selectedNoteId);

    if (!note) {
        selectedNoteId = null;
        isCreatingNewNote = false;

        renderEditor();
        return;
    }

    editorEmpty.classList.add("hidden");
    noteEditor.classList.remove("hidden");

    noteTitle.value = note.title || "";
    noteContent.value = note.content || "";

    noteMeta.textContent =
        `Last updated ${formatDateTime(note.updatedAt)}`;

    if (!isEditing) {
        editorStatus.textContent = "Viewing note";
    }
}

// Export menu
function toggleExportMenu() {
    if (selectedNoteId === null || isEditing) {
        return;
    }

    exportMenu.classList.toggle("open");
}

function closeExportMenu() {
    exportMenu.classList.remove("open");
}

// Sanitize file name
function sanitizeFileName(fileName) {
    return fileName
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .substring(0, 100) || "Untitled Note";
}

// Download file
function downloadBlob(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
        URL.revokeObjectURL(url);
    }, 1000);
}

// Export as TXT
function exportAsTxt() {
    if (selectedNoteId === null) {
        return;
    }

    const note = getNoteById(selectedNoteId);

    if (!note) {
        return;
    }

    const title = getNoteTitle(note);
    const content = note.content || "";

    const text = `${title}

${content}

----------------------------------------
Created: ${formatDateTime(note.createdAt)}
Last updated: ${formatDateTime(note.updatedAt)}
`;

    const blob = new Blob([text], {
        type: "text/plain;charset=utf-8"
    });

    const fileName =
        sanitizeFileName(title) + ".txt";

    downloadBlob(blob, fileName);

    closeExportMenu();

    showToast("Note exported as TXT.");
}

// Export as image
function exportAsImage() {
    if (selectedNoteId === null) {
        return;
    }

    const note = getNoteById(selectedNoteId);

    if (!note) {
        return;
    }

    closeExportMenu();
    showToast("Preparing note image...");

    const canvas = document.createElement("canvas");

    const width = 1400;
    const padding = 100;
    const contentWidth = width - padding * 2;

    const title = getNoteTitle(note);
    const content = note.content || "";

    const titleFontSize = 54;
    const bodyFontSize = 30;
    const lineHeight = 48;

    const context = canvas.getContext("2d");

    if (!context) {
        showToast(
            "Unable to create image.",
            "error"
        );

        return;
    }

    function wrapText(text, font) {
        context.font = font;

        const paragraphs = text.split("\n");
        const lines = [];

        paragraphs.forEach((paragraph) => {
            if (paragraph.length === 0) {
                lines.push("");
                return;
            }

            const words = paragraph.split(/\s+/);
            let currentLine = "";

            words.forEach((word) => {
                const testLine = currentLine
                    ? `${currentLine} ${word}`
                    : word;

                const textWidth =
                    context.measureText(testLine).width;

                if (
                    textWidth > contentWidth &&
                    currentLine
                ) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine = testLine;
                }
            });

            if (currentLine) {
                lines.push(currentLine);
            }
        });

        return lines;
    }

    const titleLines = wrapText(
        title,
        `700 ${titleFontSize}px Arial`
    );

    const bodyLines = wrapText(
        content,
        `${bodyFontSize}px Arial`
    );

    const headerHeight = 170;
    const titleHeight = titleLines.length * 68;

    const bodyHeight = Math.max(
        bodyLines.length * lineHeight,
        lineHeight
    );

    const footerHeight = 100;

    const totalHeight =
        padding +
        headerHeight +
        titleHeight +
        35 +
        bodyHeight +
        footerHeight +
        padding;

    canvas.width = width;
    canvas.height = Math.max(totalHeight, 700);

    // Background
    context.fillStyle = "#fffdf8";

    context.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    // Top accent
    context.fillStyle = "#292722";

    context.fillRect(
        padding,
        padding,
        70,
        7
    );

    // Title
    context.fillStyle = "#292722";
    context.font = `700 ${titleFontSize}px Arial`;

    let y = padding + headerHeight - 20;

    titleLines.forEach((line) => {
        context.fillText(
            line,
            padding,
            y
        );

        y += 68;
    });

    // Body
    y += 35;

    context.font = `${bodyFontSize}px Arial`;
    context.fillStyle = "#4c4942";

    bodyLines.forEach((line) => {
        if (line === "") {
            y += lineHeight;
            return;
        }

        context.fillText(
            line,
            padding,
            y
        );

        y += lineHeight;
    });

    // Footer
    const footerY = canvas.height - 75;

    context.beginPath();

    context.moveTo(
        padding,
        footerY
    );

    context.lineTo(
        width - padding,
        footerY
    );

    context.strokeStyle = "#ddd7cc";
    context.lineWidth = 2;

    context.stroke();

    context.fillStyle = "#8a857b";
    context.font = "18px Arial";

    context.fillText(
        `Notes • ${formatDate(note.updatedAt)}`,
        padding,
        footerY + 38
    );

    // Convert canvas to PNG
    canvas.toBlob(
        (blob) => {
            if (!blob) {
                showToast(
                    "Unable to create image.",
                    "error"
                );

                return;
            }

            const fileName =
                sanitizeFileName(title) + ".png";

            downloadBlob(blob, fileName);

            showToast(
                "Note exported as image."
            );
        },
        "image/png"
    );
}

// Event listeners
newNoteButton.addEventListener(
    "click",
    createNote
);

emptyNewNoteButton.addEventListener(
    "click",
    createNote
);

if (mobileBackButton) {
    mobileBackButton.addEventListener(
        "click",
        goBackToNotes
    );
}

editNoteButton.addEventListener(
    "click",
    startEditing
);

saveNoteButton.addEventListener(
    "click",
    saveEditedNote
);

cancelEditButton.addEventListener(
    "click",
    cancelEditing
);

deleteNoteButton.addEventListener(
    "click",
    deleteSelectedNote
);

exportNoteButton.addEventListener(
    "click",
    toggleExportMenu
);

exportTxtButton.addEventListener(
    "click",
    exportAsTxt
);

exportImageButton.addEventListener(
    "click",
    exportAsImage
);

searchInput.addEventListener(
    "input",
    renderNotesList
);

// Close export menu
document.addEventListener(
    "click",
    (event) => {
        if (
            !event.target.closest(
                ".export-wrapper"
            )
        ) {
            closeExportMenu();
        }
    }
);

// Keyboard shortcuts
document.addEventListener(
    "keydown",
    (event) => {
        const isMac = navigator.platform
            .toUpperCase()
            .includes("MAC");

        const modifier = isMac
            ? event.metaKey
            : event.ctrlKey;

        if (
            modifier &&
            event.key.toLowerCase() === "n"
        ) {
            event.preventDefault();
            createNote();
            return;
        }

        if (
            event.key === "Escape" &&
            isEditing
        ) {
            event.preventDefault();
            cancelEditing();
        }
    }
);

// Initialization
function initializeApp() {
    loadNotes();
    renderNotesList();
    renderEditor();
    setEditorMode(false);
    updateMobileEditorVisibility();
}

initializeApp();