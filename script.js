// Cümleler ve noktalama kuralları
let sentences = [
    {
        text: "Ali sabah erkenden kalktı kahvaltısını yaptı çantasını hazırladı ve okula gitti",
        rules: [
            { index: 4, mark: ",", explanation: "Sıralı cümle arası" },
            { index: 6, mark: ",", explanation: "Sıralı cümle arası" },
            { index: 8, mark: ",", explanation: "Sıralı cümle arası" },
            { index: 11, mark: ".", explanation: "Cümle sonu" }
        ]
    },
    {
        text: "Öğretmen sınıfa girdi ve sordu ödevini yapan var mı Ayşe ben yaptım dedi",
        rules: [
            { index: 5, mark: ":", explanation: "Konuşma öncesi" },
            { index: 8, mark: "?", explanation: "Soru cümlesi" },
            { index: 9, mark: ",", explanation: "Konuşma arası" },
            { index: 11, mark: ".", explanation: "Cümle sonu" }
        ]
    }
];

// Uygulama Değişkenleri
let currentSentenceIndex = 0;
let words = [];
let isDragging = false;
let draggedMark = null;
let activeWordIndex = -1;
let lastActiveWordIndex = -1;

// DOM Elementleri
const wordContainer = document.getElementById('wordContainer');
const sentenceArea = document.getElementById('sentenceArea');
const draggedMarkElement = document.getElementById('draggedMark');
const checkButton = document.getElementById('checkButton');
const nextButton = document.getElementById('nextButton');
const prevButton = document.getElementById('prevButton');
const checkModal = document.getElementById('checkModal');

// Cümleyi Ekrana Yerleştir
function displaySentence() {
    const currentSentence = sentences[currentSentenceIndex];
    words = currentSentence.text.split(' ');
    wordContainer.innerHTML = '';

    words.forEach((word, index) => {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.textContent = word;
        wordSpan.dataset.index = index;

        // Boşluk göstergesi
        const gapIndicator = document.createElement('span');
        gapIndicator.className = 'gap-indicator';
        wordSpan.appendChild(gapIndicator);

        // Noktalama işareti konteyneri
        const punctuationSpan = document.createElement('span');
        punctuationSpan.className = 'punctuation';
        punctuationSpan.dataset.index = index;
        wordSpan.appendChild(punctuationSpan);

        wordContainer.appendChild(wordSpan);
    });

    updateProgress();
    nextButton.disabled = true;
    checkButton.disabled = false;
}

// Sürükleme İşlemleri
function initializeDragAndDrop() {
    const marks = document.querySelectorAll('.mark');
    marks.forEach(mark => {
        mark.addEventListener('mousedown', handleDragStart);
        mark.addEventListener('touchstart', handleDragStart, { passive: false });
    });

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchend', handleDragEnd);
}

function handleDragStart(e) {
    isDragging = true;
    draggedMark = e.target.textContent;
    
    draggedMarkElement.textContent = draggedMark;
    draggedMarkElement.classList.add('visible');
    
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    updateDragPosition(touch.clientX, touch.clientY);

    // Sürükleme başladığında tüm genişlemeleri sıfırla
    resetWordExpansions();

    e.preventDefault();
}

function handleDragMove(e) {
    if (!isDragging) return;

    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    updateDragPosition(touch.clientX, touch.clientY);
    
    // Yavaşlatılmış kelime genişleme kontrolü
    requestAnimationFrame(() => {
        checkWordProximity(touch.clientX, touch.clientY);
    });

    e.preventDefault();
}

function updateDragPosition(x, y) {
    draggedMarkElement.style.left = `${x - draggedMarkElement.offsetWidth / 2}px`;
    draggedMarkElement.style.top = `${y - draggedMarkElement.offsetHeight / 2}px`;
}

function resetWordExpansions() {
    const words = document.querySelectorAll('.word');
    words.forEach(word => {
        word.classList.remove('expanded');
    });
    activeWordIndex = -1;
}
// Kelime Yakınlık ve Genişleme İşlemleri
function checkWordProximity(x, y) {
    const words = document.querySelectorAll('.word');
    let nearestWord = null;
    let minDistance = Infinity;
    let nearestIndex = -1;

    words.forEach(word => {
        const rect = word.getBoundingClientRect();
        const wordX = rect.left + rect.width / 2;
        const wordY = rect.top + rect.height / 2;
        const distance = Math.hypot(x - wordX, y - wordY);

        if (distance < minDistance && distance < 100) {
            minDistance = distance;
            nearestWord = word;
            nearestIndex = parseInt(word.dataset.index);
        }
    });

    // Sadece en yakın kelime değiştiyse güncelle
    if (nearestIndex !== activeWordIndex) {
        lastActiveWordIndex = activeWordIndex;
        activeWordIndex = nearestIndex;
        updateWordExpansions(nearestIndex);
    }
}

function updateWordExpansions(index) {
    const words = document.querySelectorAll('.word');
    words.forEach((word, i) => {
        const shouldExpand = (index !== -1 && Math.abs(i - index) <= 1);
        word.classList.toggle('expanded', shouldExpand);
    });
}

// Sürükleme İşlemini Bitir ve İşaret Yerleştirme
function handleDragEnd(e) {
    if (!isDragging) return;

    const finalX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const finalY = e.type === 'touchend' ? e.changedTouches[0].clientY : e.clientY;
    
    if (activeWordIndex !== -1) {
        placePunctuation(activeWordIndex, draggedMark);
    }

    // Temizlik işlemleri
    isDragging = false;
    draggedMarkElement.classList.remove('visible');
    resetWordExpansions();
    draggedMark = null;
}

function placePunctuation(index, mark) {
    const punctuationElement = document.querySelector(`.word[data-index="${index}"] .punctuation`);
    if (punctuationElement) {
        punctuationElement.textContent = mark;
        
        // İşaret yerleştirildikten sonra yavaşça boşlukları kapat
        setTimeout(() => {
            resetWordExpansions();
        }, 300);
    }
}

// Cevapları Kontrol Et
function checkAnswers() {
    const currentSentence = sentences[currentSentenceIndex];
    let allCorrect = true;

    // Tüm işaretleri kontrol et
    currentSentence.rules.forEach(({index, mark}) => {
        const punctuation = document.querySelector(`.word[data-index="${index}"] .punctuation`);
        if (!punctuation || punctuation.textContent !== mark) {
            allCorrect = false;
        }
    });

    // Fazladan işaret var mı kontrol et
    document.querySelectorAll('.punctuation').forEach(punct => {
        if (punct.textContent) {
            const wordIndex = parseInt(punct.parentElement.dataset.index);
            const expectedRule = currentSentence.rules.find(r => r.index === wordIndex);
            if (!expectedRule || expectedRule.mark !== punct.textContent) {
                allCorrect = false;
            }
        }
    });

    // Sonucu göster
    showModal(checkModal);
    document.getElementById('checkModalMessage').textContent = allCorrect ?
        'Tebrikler! Tüm noktalama işaretleri doğru.' :
        'Bazı noktalama işaretleri yanlış veya eksik. Tekrar deneyin.';

    if (allCorrect) {
        nextButton.disabled = false;
    }
}

// Modal İşlemleri
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

// Butonları ve İlerlemeyi Güncelle
function updateProgress() {
    const progressBar = document.querySelector('.progress-bar');
    progressBar.style.width = `${((currentSentenceIndex + 1) / sentences.length) * 100}%`;
    
    prevButton.disabled = currentSentenceIndex === 0;
    nextButton.disabled = true;
}

// Navigasyon İşlemleri
prevButton.addEventListener('click', () => {
    if (currentSentenceIndex > 0) {
        currentSentenceIndex--;
        displaySentence();
    }
});

nextButton.addEventListener('click', () => {
    if (currentSentenceIndex < sentences.length - 1) {
        currentSentenceIndex++;
        displaySentence();
    } else {
        showEndScreen();
    }
});

document.getElementById('closeCheckModal').addEventListener('click', () => {
    hideModal(checkModal);
});
// Bitiş Ekranı
function showEndScreen() {
    wordContainer.innerHTML = `
        <div class="end-screen">
            <h2>Tebrikler!</h2>
            <p>Tüm alıştırmaları başarıyla tamamladınız.</p>
            <button class="btn btn-primary" onclick="restartExercise()">
                Tekrar Başla
            </button>
        </div>
    `;
    
    document.querySelector('.marks-container').style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
}

// Yeniden Başlat
function restartExercise() {
    currentSentenceIndex = 0;
    document.querySelector('.marks-container').style.display = 'flex';
    document.querySelector('.controls').style.display = 'flex';
    displaySentence();
}

// Modal ve Form Elementleri
const addModal = document.getElementById('addModal');
const editModal = document.getElementById('editModal');
const newSentenceInput = document.getElementById('newSentence');
const editSentenceInput = document.getElementById('editSentence');
const fileInput = document.getElementById('fileInput');

// Cümle Ekleme
document.getElementById('addSentenceBtn').addEventListener('click', () => {
    newSentenceInput.value = '';
    showModal(addModal);
    updateRulesList(addModal);
});

document.getElementById('saveNewSentence').addEventListener('click', () => {
    const text = newSentenceInput.value.trim();
    if (text) {
        const rules = collectRules(addModal.querySelector('.rules-list'));
        sentences.push({ text, rules });
        currentSentenceIndex = sentences.length - 1;
        hideModal(addModal);
        displaySentence();
    }
});

document.getElementById('cancelAdd').addEventListener('click', () => {
    hideModal(addModal);
});

// Cümle Düzenleme
document.getElementById('editSentenceBtn').addEventListener('click', () => {
    const currentSentence = sentences[currentSentenceIndex];
    editSentenceInput.value = currentSentence.text;
    showModal(editModal);
    updateRulesList(editModal, currentSentence.rules);
});

document.getElementById('saveEdit').addEventListener('click', () => {
    const text = editSentenceInput.value.trim();
    if (text) {
        const rules = collectRules(editModal.querySelector('.rules-list'));
        sentences[currentSentenceIndex] = { text, rules };
        hideModal(editModal);
        displaySentence();
    }
});

document.getElementById('cancelEdit').addEventListener('click', () => {
    hideModal(editModal);
});

// İçe/Dışa Aktarma
document.getElementById('exportBtn').addEventListener('click', () => {
    const data = JSON.stringify(sentences, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'noktalama_cumleleri.json';
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('importBtn').addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedSentences = JSON.parse(event.target.result);
                if (Array.isArray(importedSentences)) {
                    sentences = importedSentences;
                    currentSentenceIndex = 0;
                    displaySentence();
                    alert('Cümleler başarıyla içe aktarıldı.');
                }
            } catch (error) {
                alert('Geçersiz dosya formatı!');
            }
        };
        reader.readAsText(file);
    }
});

// Silme İşlemi
document.getElementById('deleteBtn').addEventListener('click', () => {
    if (sentences.length > 1 && confirm('Bu cümleyi silmek istediğinizden emin misiniz?')) {
        sentences.splice(currentSentenceIndex, 1);
        if (currentSentenceIndex >= sentences.length) {
            currentSentenceIndex = sentences.length - 1;
        }
        displaySentence();
    } else if (sentences.length === 1) {
        alert('En az bir cümle bulunmalıdır!');
    }
});

// Kural İşlemleri
function addRuleItem(modal, rule = null) {
    const rulesList = modal.querySelector('.rules-list');
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'rule-item';

    const wordSelect = document.createElement('select');
    wordSelect.className = 'word-select';
    updateWordOptions(wordSelect, modal === addModal ? newSentenceInput : editSentenceInput, rule?.index);

    const markSelect = document.createElement('select');
    markSelect.className = 'mark-select';
    ['.', ',', '!', '?', ':', ';'].forEach(mark => {
        const option = document.createElement('option');
        option.value = mark;
        option.textContent = mark;
        if (rule?.mark === mark) option.selected = true;
        markSelect.appendChild(option);
    });

    const explanation = document.createElement('input');
    explanation.type = 'text';
    explanation.placeholder = 'Açıklama';
    if (rule?.explanation) explanation.value = rule.explanation;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-rule';
    deleteBtn.textContent = '×';
    deleteBtn.onclick = () => ruleDiv.remove();

    ruleDiv.appendChild(wordSelect);
    ruleDiv.appendChild(markSelect);
    ruleDiv.appendChild(explanation);
    ruleDiv.appendChild(deleteBtn);
    rulesList.appendChild(ruleDiv);
}

function updateWordOptions(select, textarea, selectedIndex = 0) {
    const words = textarea.value.trim().split(' ');
    select.innerHTML = '';
    words.forEach((word, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = word;
        option.selected = index === selectedIndex;
        select.appendChild(option);
    });
}

function updateRulesList(modal, rules = []) {
    const rulesList = modal.querySelector('.rules-list');
    rulesList.innerHTML = '';
    if (rules.length > 0) {
        rules.forEach(rule => addRuleItem(modal, rule));
    }
}

function collectRules(rulesList) {
    const rules = [];
    rulesList.querySelectorAll('.rule-item').forEach(item => {
        const index = parseInt(item.querySelector('.word-select').value);
        const mark = item.querySelector('.mark-select').value;
        const explanation = item.querySelector('input').value;
        rules.push({ index, mark, explanation });
    });
    return rules;
}

// Textarea değişiklik olayları
[newSentenceInput, editSentenceInput].forEach(textarea => {
    textarea.addEventListener('input', (e) => {
        const modal = e.target.closest('.modal');
        const wordSelects = modal.querySelectorAll('.word-select');
        wordSelects.forEach(select => updateWordOptions(select, e.target));
    });
});

// Uygulama Başlangıcı
checkButton.addEventListener('click', checkAnswers);
window.addEventListener('load', () => {
    displaySentence();
    initializeDragAndDrop();
});
