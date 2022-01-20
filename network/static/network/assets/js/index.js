

jQuery(function($) {
    $('.post-container').on('scroll', function() {
        if ($(this).scrollTop() +
            $(this).innerHeight() >= 
            $(this)[0].scrollHeight) {
            
            get_posts();
        }
    });
});

function get_posts() {
    const request = new Request(
        `/posts/${page + 1}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'GET',
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        page +=1;
        if (data.success) {
            data.posts.forEach(post => {
                var id = post.id; var content = Object.values(post);
                post_div = document.createElement('div');
                post_div.className = 'post';

                like_status = "";
                dislike_status = "";
                if ((post.liked != null) && (post.liked)) {
                    like_status = "post-like-active";
                }

                if ((post.liked != null) && (!post.liked)) {
                    dislike_status = "post-like-active";
                }
                post_div.innerHTML = `
                        <div class="post-user">
                            <a href="/profile/${post.user_id}"><i class="fas fa-user-circle"></i></a>
                        </div>
                        <div class="post-content">
                            <div class="post-username">
                                <a href="/profile/${post.user_id}">${post.user}</a>
                                <span>${post.date_created}</span>
                            </div>
                            <div class="post-text">
                                <p id="post-content-${post.id}">${post.post}</p>
                            </div>
                            <div class="post-buttons">
                                <div class="post-button">
                                    <a id="like-${post.id}" data-post="${post.id}" onclick="like_post(this)"><i class="far fa-heart ${like_status}"></i></a>
                                    <span id="likes-${post.id}">${post.likes}</span>
                                </div>
                                <div class="post-button">
                                    <a id="dislike-${post.id}" data-post="${post.id}" onclick="dislike_post(this)"><i class="fas fa-heart-broken ${dislike_status}"></i></a>
                                    <span id="dislikes-${post.id}">${post.dislikes}</span>
                                </div>
                            </div>
                        </div>
                `;

                if (post.user == user.username) {
                    post_div.innerHTML += `
   
                            <div class="post-edit-button">
                                <button data-toggle="modal" data-target="#twit-modal-edit" data-post="${post.id}" data-content="${post.post}" onclick="open_post(this);">
                                    <i class="far fa-edit"></i>
                                </button>
                            </div>

                    `;
                }

                document.querySelector('.post-container').appendChild(post_div);
            });
            
        }
	})
    .catch(error => {
        console.error( error);
    });
}