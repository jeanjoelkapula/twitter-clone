const user = JSON.parse(document.getElementById('user').textContent);

//csrf token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

function like_post(button) {
    unliked = false;

    if (!document.querySelector(`#like-${button.dataset.post}`).childNodes[0].classList.contains('post-like-active')){
        json_data = JSON.stringify({
            liked: 'True'
        });

        
    }
    else {
        json_data = JSON.stringify({
            unliked: 'True'
        });

        unliked = true;
    }

    const request = new Request(
        `/post/${button.dataset.post}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        
        if (unliked) {
            $(document.querySelector(`#like-${button.dataset.post}`).childNodes[0]).removeClass("post-like-active");
        }
        else {
            $(document.querySelector(`#like-${button.dataset.post}`).childNodes[0]).addClass("post-like-active");
        }
        
        $(document.querySelector(`#dislike-${button.dataset.post}`).childNodes[0]).removeClass("post-like-active");
        
        if (data.likes > 0) {
            document.querySelector(`#likes-${button.dataset.post}`).innerHTML = data.likes;
        }
        else {
            document.querySelector(`#likes-${button.dataset.post}`).innerHTML = "";
        }
   
        if (data.dislikes > 0) {
            document.querySelector(`#dislikes-${button.dataset.post}`).innerHTML = data.dislikes;
        }
        else {
            document.querySelector(`#dislikes-${button.dataset.post}`).innerHTML = "";
        }
	})
    .catch(error => {
        console.error( error);
    });
}

function dislike_post(button) {
    unliked = false;

    if (!document.querySelector(`#dislike-${button.dataset.post}`).childNodes[0].classList.contains('post-like-active')){
        json_data = JSON.stringify({
            liked: 'False'
        });
        
    }
    else {
        json_data = JSON.stringify({
            unliked: 'True'
        });

        unliked = true;
    }

    const request = new Request(
        `/post/${button.dataset.post}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'PUT',
        body: json_data,
         "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
  
        if (unliked) {
            $(document.querySelector(`#dislike-${button.dataset.post}`).childNodes[0]).removeClass("post-like-active");
        }
        else {
            $(document.querySelector(`#dislike-${button.dataset.post}`).childNodes[0]).addClass("post-like-active");
        }

        
        $(document.querySelector(`#like-${button.dataset.post}`).childNodes[0]).removeClass("post-like-active");
  
        if (data.likes > 0) {
            document.querySelector(`#likes-${button.dataset.post}`).innerHTML = data.likes;
        }
        else {
            document.querySelector(`#likes-${button.dataset.post}`).innerHTML = "";
        }
   
        if (data.dislikes > 0) {
            document.querySelector(`#dislikes-${button.dataset.post}`).innerHTML = data.dislikes;
        }
        else {
            document.querySelector(`#dislikes-${button.dataset.post}`).innerHTML = "";
        }
	})
    .catch(error => {
        console.error( error);
    });
}

function unfollow_user(id) {
    const request = new Request(
        `/follow/${id}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        is_follow: 'False'
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        document.querySelector('#unfollow-div').style.display = "none";
        document.querySelector('#follow-div').style.display = "block";

        document.querySelector('#followers').innerHTML = data.followers;
        document.querySelector('#followees').innerHTML = data.followees;
	})
    .catch(error => {
        console.error( error);
    });
}


function follow_user(id) {
    const request = new Request(
        `/follow/${id}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        is_follow: 'True'
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        document.querySelector('#unfollow-div').style.display = "block";
        document.querySelector('#follow-div').style.display = "none";

        document.querySelector('#followers').innerHTML = data.followers;
        document.querySelector('#followees').innerHTML = data.followees;
	})
    .catch(error => {
        console.error( error);
    });
}


async function  get_logged_user_following() {
    result = [];
    const request = new Request(
        `/user_following/${user.id}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'GET',
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        console.log(data.followees);
        user.followees = data.followees;
        user.followers = data.followers;
    });
   
}

function load_following (id) {
    const request = new Request(
        `/user_following/${id}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    fetch(request, {
        method: 'GET',
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(function(data) {


        //load followers 
        followers_div = document.querySelector('#followers');
        followers_div.innerHTML = "";

        data.followers.forEach(function(follower) {
            div = document.createElement('div');
            div.className = "follow-card post";

            //check if logged in user follows profile user
            found = user.followees.find( ({ id }) => id === follower.id );
            is_followee = false;

            if (found != undefined) {
                is_followee = true;
            }

            div.innerHTML = `
                <div class="follow-user-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="follow-username">
                    <div class="post-username">
                        <span><a href='/profile/${follower.id}'>${follower.username}</a></span>
                    </div>
                </div>
            `;
            
            if (is_followee) {
                div.innerHTML += `
                    <div name="unfollow-div-${follower.id}" class="unfollow-button">
                        <button  onclick="profile_unfollow(${follower.id}, ${id});"><span>Following</span></button>
                    </div>
                `;
            }
            else {
                div.innerHTML += `
                    <div name="follow-div-${follower.id}" class="follow-button">
                        <button onclick="profile_follow(${follower.id}, ${id});"><span>Follow</span></button>
                    </div>
                `;
            }

            followers_div.append(div);
        });

        //load followees 
        follwees_div = document.querySelector('#following');
        follwees_div.innerHTML = "";

        data.followees.forEach(function(followee) {
            div = document.createElement('div');
            div.className = "follow-card post";

            //check if logged in user follows profile user
            
            console.log(user.followees);
            found = user.followees.find( ({ id }) => id === followee.id );
            is_followee = false;

            if (found != undefined) {
                is_followee = true;
            }

            div.innerHTML = `
                <div class="follow-user-icon">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="follow-username">
                    <div class="post-username">
                    <span><a href='/profile/${followee.id}'>${followee.username}</a></span>
                    </div>
                </div>
            `;
            
            if (is_followee) {
                div.innerHTML += `
                    <div name="unfollow-div-${followee.id}" class="unfollow-button">
                        <button  onclick="profile_unfollow(${followee.id}, ${id});"><span>Following</span></button>
                    </div>
                `;
            }
            else {
                div.innerHTML += `
                    <div name="follow-div-${followee.id}" class="follow-button">
                        <button onclick="profile_follow(${followee.id}, ${id});"><span>Follow</span></button>
                    </div>
                `;
            }

            follwees_div.append(div);
        });

        console.log('loaded');
	})
    .catch(error => {
        console.error( error);
    });
}


function profile_follow(follower_id, profile_user_id) {
    const request = new Request(
        `/follow/${follower_id}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        is_follow: 'True'
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        request_user_following();
       load_following(profile_user_id);
	})
    .catch(error => {
        console.error( error);
    });
}

async function request_user_following() {
    await get_logged_user_following();
}
function profile_unfollow(follower_id, profile_user_id) {
    const request = new Request(
        `/follow/${follower_id}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        is_follow: 'False'
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        request_user_following();
        load_following(profile_user_id);
	})
    .catch(error => {
        console.error( error);
    });
}

function open_edit_post(post) {
    textarea = document.querySelector('#edit-post');
    textarea.value = post.post;

    document.querySelector('#edit-post-button').dataset.id = post.id;
}

function edit_post(button) {
    post_id = button.dataset.id;
    post = document.querySelector('#edit-post').value;

    const request = new Request(
        `/post/${post_id}/edit`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        post: post
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        if (data.success) {
            document.querySelector(`#post-content-${post_id}`).innerHTML = post;
            $("#twit-modal-edit").modal('hide');
        }
	})
    .catch(error => {
        console.error( error);
    });
}

function set_url(path) {
    window.history.pushState("", "following", path);
}