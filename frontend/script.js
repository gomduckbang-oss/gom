// 페이지의 모든 요소가 로드된 후 스크립트가 실행되도록 합니다.
document.addEventListener('DOMContentLoaded', () => {

    console.log("페이지 스크립트가 로드되었습니다.");

    const birthdayInput = document.getElementById('birthday-input');
    const submitBtn = document.getElementById('submit-btn');
    const chatContainer = document.getElementById('chat-container');
    const errorMessage = document.getElementById('error-message');

    // 버튼이 실제로 존재하는지 확인하고 클릭 이벤트를 연결합니다.
    if (submitBtn) {
        console.log("'결과 보기' 버튼을 찾았습니다.");
        submitBtn.addEventListener('click', showResult);
    } else {
        console.error("'결과 보기' 버튼을 찾을 수 없습니다. HTML의 id를 확인해주세요.");
    }

    // 엔터 키 입력 시 결과보기가 실행되도록 합니다.
    if (birthdayInput) {
        birthdayInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                showResult();
            }
        });
    }

    async function showResult() {
        console.log("'결과 보기' 버튼이 클릭되었습니다!");

        chatContainer.innerHTML = '';
        errorMessage.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = '분석 중...';

        const birthday = birthdayInput.value;
        console.log(`입력된 생년월일: ${birthday}`);

        if (!/^\d{8}$/.test(birthday)) {
            showError("생년월일 8자리를 정확히 입력해주세요.");
            submitBtn.disabled = false;
            submitBtn.textContent = '결과 보기';
            return;
        }

        try {
            console.log("서버에 데이터를 요청합니다...");
            const response = await fetch(`/api/fortune?birthday=${birthday}`);
            console.log("서버로부터 응답을 받았습니다:", response);

            const data = await response.json();
            console.log("응답 데이터를 JSON으로 변환했습니다:", data);

            if (!response.ok) {
                throw new Error(data.error || '데이터를 불러오는데 실패했습니다.');
            }

            displayMessages(data.messages);

        } catch (error) {
            console.error("오류 발생:", error);
            showError(error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '결과 보기';
        }
    }

    function displayMessages(messages) {
        if (!messages || messages.length === 0) {
            showError('표시할 메시지가 없습니다.');
            return;
        }
        let delay = 0;
        messages.forEach(text => {
            setTimeout(() => {
                addMessageBubble(text);
            }, delay);
            delay += 800;
        });
    }

    function addMessageBubble(text) {
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble max-w-xs md:max-w-sm bg-blue-500 text-white p-3 rounded-lg rounded-bl-none mb-3 shadow';
        bubble.textContent = text;
        chatContainer.appendChild(bubble);
        
        setTimeout(() => bubble.classList.add('show'), 10);

        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('hidden');
    }
});
