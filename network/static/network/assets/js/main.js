
(function ($) {
    "use strict";


    /*==================================================================
    [ Focus input ]*/
    $('.input100').each(function(){
        $(this).on('blur', function(){
            if($(this).val().trim() != "") {
                $(this).addClass('has-val');
            }
            else {
                $(this).removeClass('has-val');
            }
        })    
    })
  
  
    /*==================================================================
    [ Validate ]*/
    var input = $('.validate-input .input100');

    $('.validate-form').on('submit',function(){
        var check = true;

        for(var i=0; i<input.length; i++) {
            if(validate(input[i]) == false){
                showValidate(input[i]);
                check=false;
            }
        }

        return check;
    });


    $('.validate-form .input100').each(function(){
        $(this).focus(function(){
           hideValidate(this);
        });
    });

    function validate (input) {
        if($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
            if($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                return false;
            }
        }
        else {
            if($(input).val().trim() == ''){
                return false;
            }
        }
    }

    function showValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        var thisAlert = $(input).parent();

        $(thisAlert).removeClass('alert-validate');
    }
    
    /*==================================================================
    [ Show pass ]*/
    var showPass = 0;
    $('.btn-show-pass').on('click', function(){
        if(showPass == 0) {
            $(this).next('input').attr('type','text');
            $(this).addClass('active');
            showPass = 1;
        }
        else {
            $(this).next('input').attr('type','password');
            $(this).removeClass('active');
            showPass = 0;
        }
        
    });


})(jQuery);

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
    const request = new Request(
        `/post/${button.dataset.post}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        liked: 'True'
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        
        $(document.querySelector(`#like-${button.dataset.post}`).childNodes[0]).addClass("post-like-active");
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
    const request = new Request(
        `/post/${button.dataset.post}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    json_data = JSON.stringify({
        liked: 'False'
    })

    fetch(request, {
        method: 'PUT',
        body: json_data,
         "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
  
        $(document.querySelector(`#dislike-${button.dataset.post}`).childNodes[0]).addClass("post-like-active");
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