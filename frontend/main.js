document.addEventListener('DOMContentLoaded', () => {
    const mainContainer = document.getElementById('main-container');
    const birthdayInput = document.getElementById('birthday-input');
    const submitBtn = document.getElementById('submit-btn');
    const errorMessage = document.getElementById('error-message');

    const showResults = () => {
        const birthday = birthdayInput.value;

        // 입력값 유효성 검사
        if (!/^\d{8}$/.test(birthday)) {
            errorMessage.textContent = "생년월일 8자리를 정확히 입력해주세요.";
            return;
        }
        errorMessage.textContent = ""; // 에러 메시지 초기화

        // 1. 애니메이션 클래스 추가
        mainContainer.classList.add('show-results');

        // 2. 애니메이션이 끝난 후 페이지 이동
        setTimeout(() => {
            window.location.href = `results.html?birthday=${birthday}`;
        }, 800); // 0.8초 후 이동 (CSS transition 시간과 일치)
    };

    submitBtn.addEventListener('click', showResults);
    birthdayInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            showResults();
        }
    });
});
