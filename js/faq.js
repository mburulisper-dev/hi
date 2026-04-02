document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        const icon = item.querySelector('.faq-icon');

        question.addEventListener('click', function() {
            const isOpen = answer.style.display !== 'none';

            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.querySelector('.faq-answer').style.display = 'none';
                    otherItem.querySelector('.faq-icon').textContent = '+';
                    otherItem.classList.remove('active');
                }
            });

            // Toggle current item
            if (isOpen) {
                answer.style.display = 'none';
                icon.textContent = '+';
                item.classList.remove('active');
            } else {
                answer.style.display = 'block';
                icon.textContent = '−';
                item.classList.add('active');
            }
        });
    });
});