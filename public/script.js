socket.on('newStoryComment', function(data) {
    const { storyId, comment } = data;
    const commentsList = document.getElementById(`comments-list-${storyId}`);
    if (commentsList) {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment fade-in';
        const time = new Date(comment.timestamp).toLocaleTimeString('ar-SA', {
            hour: '2-digit',
            minute: '2-digit'
        });
        commentDiv.innerHTML = `
            <span class="comment-user rank-${comment.rank}">${comment.display_name}</span>
            <span class="comment-time">${time}</span>
            <div>${comment.comment}</div>
        `;
        commentsList.appendChild(commentDiv);
        // تحديث عداد التعليقات في الزر
        const commentButton = document.querySelector(`#news-post-${storyId} .news-post-actions button:nth-child(4)`);
        if (commentButton) {
            const currentCount = parseInt(commentButton.textContent.match(/\d+/)) || 0;
            commentButton.textContent = `💬 تعليق (${currentCount + 1})`;
        }
    }
});
