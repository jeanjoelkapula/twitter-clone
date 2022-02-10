//get csrf token
current_chat =  JSON.parse(document.getElementById('current-chat').textContent);

//last page of messages to load for chat
last_page = 1;

//last message date for chat
last_message_date = JSON.parse(document.getElementById('last-date').textContent);

if (last_message_date != '') {
    last_message_date = new Date(last_message_date);
}
else {
    last_message_date = new Date();
}


//connection established in extended layout file
//on message
chatSocket.onmessage = async function(e) {
    const data = JSON.parse(e.data);
    chat_box = document.querySelector('#chat-mainbox');
    
    //chat message box may not be onto the page
    if (chat_box) {
        message_list = document.querySelector('#message-list');
        
        //chat message box maybe on the page but hidden when no chat is selected
        if (chat_box.style.display == 'none') {
            if (data.message.recipient == user.username) {
            
                if (data.is_chat_new == true) {
                    chat_list = document.querySelector('#chat-list');
                    contact_link = document.createElement('a');
                    contact_link.id = `contact-${data.chat.id}`;
                    contact_link.dataset.chat = data.chat.id;
                    contact_link.className = "list-group-item list-group-item-action";
                    
                    contact_link.innerHTML = `
                        <i class="fas fa-user-circle"></i>
                        <div class="media-body ml-3">
                            ${data.message.sender}
                        </div>
                        <div class="badge chat-badge" id="contact-badge-${data.chat.id}" data-badge="1">1</div>
                    `;
    
                    $(contact_link).on('click', function(e){
                        chat_click(e.target);
                    });
    
                    chat_list.insertChildAtIndex(contact_link, 0);
                    
                }
                else {
                    contact_chat_badge = document.querySelector(`#contact-badge-${data.chat.id}`);
                    badge_value = parseInt(contact_chat_badge.dataset.badge);
                    contact_chat_badge.innerHTML = badge_value + 1;
                    $(contact_chat_badge).removeClass('d-none');

                }

                set_menu_badge(data.total_unread_count);

                
            }
            
        }
        else {

            if (data.message.recipient == user.username) {
                set_menu_badge(data.total_unread_count);

                if (data.is_chat_new == true) {
                    chat_list = document.querySelector('#chat-list');
                    contact_link = document.createElement('a');
                    contact_link.id = `contact-${data.chat.id}`;
                    contact_link.dataset.chat = data.chat.id;
                    contact_link.className = "list-group-item list-group-item-action";
                    
                    contact_link.innerHTML = `
                        <i class="fas fa-user-circle"></i>
                        <div class="media-body ml-3">
                            ${data.message.sender}
                        </div>
                        <div class="badge chat-badge" id="contact-badge-${data.chat.id}" data-badge="1">1</div>
                    `;
    
                    $(contact_link).on('click', function(e){
                        chat_click(e.target);
                    });
    
                    chat_list.insertChildAtIndex(contact_link, 0);
                    
                }
            }
            else {
                /*
                    when a user messages another user for the first time
                    a chat is added with id -1.

                    once the chat now exists the div will be updated with the correct dataset values
                */
                if (data.is_chat_new == true) {
                    contact_link = document.querySelector('#contact--1');
                    contact_link.id = `contact-${data.chat.id}`;
                    contact_link.dataset.chat = data.chat.id;
                    contact_link.className = "list-group-item list-group-item-action active";
    
                    if (data.total_unread_count == 0) {
                        badge_val = "";
                    }
                    else {
                        badge_val = data.chat.total_unread_count;
                    }
                    contact_link.innerHTML = `
                        <i class="fas fa-user-circle"></i>
                        <div class="media-body ml-3">
                            ${data.message.recipient}
                        </div>
                        <div class="badge chat-badge" id="contact-badge-${data.chat.id}" data-badge="0"></div>
                    `;
    
                    //set current chat
                    current_chat = data.chat.id;
    
                    //set url
                    window.history.pushState("", "", '/messages/' + data.chat.id);
                }
            }

            //if the chat is currently open
            if(current_chat == data.chat.id) {

                message_div = document.createElement('div');
            
                //create date object from timestamp
                message_date = new Date(data.message.timestamp);

                //check for last message date
                str = `${message_date.toLocaleString('default', { month: 'short' })} ${message_date.getDate()} ${message_date.getFullYear()}`;
                date =  new Date(str);

                if (date > last_message_date) {
                    last_message_date = date;

                    date_separator = document.createElement('div');
                    date_separator.className = 'chat-date-separator';
                    date_separator.innerHTML = `${message_date.toLocaleString('default', { month: 'short' })}. ${message_date.getDate()}, ${message_date.getFullYear()}`;

                    message_list.append(date_separator);
                }
            
                if (data.message.sender == user.username) {
                    message_div.className = 'chat-message-right mb-4';
                }
                else {
                    message_div.className = 'chat-message-left mb-4';
                }
                
                message_div.innerHTML = `
                    <div>
                        <a href="javascript:void(0)"><i class="fas fa-user-circle"></i></a>
                        <div class="text-muted  text-nowrap mt-2">${formatAMPM(message_date)}</div>
                    </div>
                    <div class="chat-text flex-shrink-1 chat-item rounded py-2 px-3 mr-3">
                        <div class="font-weight-semibold mb-1 chat-text-username">${data.message.sender}</div>
                        ${data.message.message}
                    </div>
                `;
            
                message_list.append(message_div);

                //scroll to bottom
                $('#message-list').animate({ scrollTop: $('#message-list').prop("scrollHeight")}, 1000);

                if (data.message.recipient == user.username) {
                    badge_count = await set_messages_status(data.chat.id);
                    set_menu_badge(badge_count);
                }

            }
            else {

                if (data.message.recipient == user.username) {
                    contact_chat_badge = document.querySelector(`#contact-badge-${data.chat.id}`);
                    if (contact_chat_badge) {
                        badge_value = parseInt(contact_chat_badge.dataset.badge);
                        badge_value += 1;
                        contact_chat_badge.dataset.badge = badge_value;
                        contact_chat_badge.innerHTML = badge_value;
                        $(contact_chat_badge).removeClass('d-none');
                    }
        
                }
            }
        }

        //move current to the top of the list
        chat_list = document.querySelector('#chat-list');
        chat = document.querySelector(`#contact-${data.chat.id}`);
        
        if (chat) {
            chat.remove();
            chat_list.insertChildAtIndex(chat, 0);
        }
    }
    else {
        set_menu_badge(data.total_unread_count);
        
    }
   
    
};

$(function() {

    $('.chat-sidebox-toggler').click(function(e) {
        e.preventDefault();
        $('.chat-wrapper').toggleClass('chat-sidebox-open');
    });

    $('#message-list').animate({ scrollTop: $('#message-list').prop("scrollHeight")}, 1000);

    document.querySelector('#chat-message-input').onkeyup = function(e) {
        if (e.keyCode === 13) {  // enter, return
            document.querySelector('#chat-message-submit').click();
        }
    };

    //on message send
    document.querySelector('#chat-message-submit').onclick = function(e) {
        const messageInputDom = document.querySelector('#chat-message-input');
        const button = document.querySelector('#chat-message-submit');
        const message = messageInputDom.value;

        if (parseInt(button.dataset.chat) < 0) {
            data = JSON.stringify({
                'chat': button.dataset.chat,
                'recipient': button.dataset.recipient,
                'message': message,
                'new_chat': 'True'
            });
        }
        else {
            data = JSON.stringify({
                'chat': button.dataset.chat,
                'recipient': button.dataset.recipient,
                'message': message,
                'new_chat': 'False'
            });
        }
        chatSocket.send(data);
        messageInputDom.value = '';
    };

    //load posts on scroll to the top
    $('#message-list').on('scroll', async function() {
        if ($('#message-list').scrollTop() == 0) {
            send_button = document.querySelector('#chat-message-submit');
            message_list = document.querySelector('#message-list');
            chat = await request_chat(current_chat, last_page + 1, 'desc');

            if (chat.messages.length > 0){
                chat.messages.forEach((message, index) => {
                    //create message date last_message_date
                    message_date = new Date(message.timestamp);
                    format_str = `${message_date.toLocaleString('default', { month: 'short' })} ${message_date.getDate()} ${message_date.getFullYear()}`;
                    id_format_str = `${message_date.toLocaleString('default', { month: 'short' })}-${message_date.getDate()}-${message_date.getFullYear()}`;
        
                    //check for date separator 
                    date_separator = document.getElementById(id_format_str);
        
                    message_div = document.createElement('div');
        
                    if (message.sender == user.username) {
                        message_div.className = 'chat-message-right mb-4';
                    }
                    else {
                        message_div.className = 'chat-message-left mb-4';
                    }
                    
                    message_div.innerHTML = `
                        <div>
                            <a href="javascript:void(0)"><i class="fas fa-user-circle"></i></a>
                            <div class="text-muted  text-nowrap mt-2">${formatAMPM(message_date)}</div>
                        </div>
                        <div class="chat-text flex-shrink-1 chat-item rounded py-2 px-3 mr-3">
                            <div class="font-weight-semibold mb-1 chat-text-username">${message.sender}</div>
                            ${message.message}
                        </div>
                    `;
        
                    if (date_separator) {
                        insertAfter(message_div, date_separator);
                    }
                    else {

                        date_separator = document.createElement('div');
                        date_separator.id = id_format_str;
                        date_separator.className = 'chat-date-separator';
                        date_separator.innerHTML = `${message_date.toLocaleString('default', { month: 'short' })}. ${message_date.getDate()}, ${message_date.getFullYear()}`;    

                        message_list.insertBefore(date_separator, message_list.children[0])
                        insertAfter(message_div, date_separator);
                    }
        
                });
                
            }

            last_page += 1;

        }
    });

});

function set_active_chat(element) {
    $('.list-group-item').each(function( index, item ) {
        $(item).removeClass('active');
    });

    $(element).addClass('active');
}

async function chat_click(element) {
    contact_chat_badge = document.querySelector(`#contact-badge-${element.dataset.chat}`);
    badge_count = null;

    if (element.dataset.chat != parseInt(current_chat)) {
        current_chat = element.dataset.chat;
 
        chat_header_username = document.querySelector('#chat-header-username');
        message_list = document.querySelector('#message-list');
        message_list.dataset.chat = element.dataset.chat;
        
        //show chat view
        document.querySelector('#unselected-chat-container').style.display = 'none';
        document.querySelector('#chat-mainbox').style.display = 'block';

        //toggle chat sidebox 
        $('.chat-wrapper').toggleClass('chat-sidebox-open');

        set_active_chat(element);

        //set send button dataset
        send_button = document.querySelector('#chat-message-submit');
        send_button.dataset.chat = element.dataset.chat;

        //set url
        window.history.pushState("", "", '/messages/' + element.dataset.chat);

        //reset messages page to load 
        last_page = 1;

        chat = await request_chat(element.dataset.chat, last_page, 'asc');
        recipient = chat.participants.find(p => p.id != user.id);
        send_button.dataset.recipient = recipient.id;

        //set username header
        chat_header_username.innerHTML = recipient.username;

        //load chat messages
        message_list.innerHTML = '';
        chat.messages.forEach((message, index) => {
            //create message date last_message_date
            message_date = new Date(message.timestamp);
            format_str = `${message_date.toLocaleString('default', { month: 'short' })} ${message_date.getDate()} ${message_date.getFullYear()}`;
            id_format_str = `${message_date.toLocaleString('default', { month: 'short' })}-${message_date.getDate()}-${message_date.getFullYear()}`;

            if (index == 0){
                date_separator = document.createElement('div');
                date_separator.id = id_format_str;
                date_separator.className = 'chat-date-separator';
                date_separator.innerHTML = `${message_date.toLocaleString('default', { month: 'short' })}. ${message_date.getDate()}, ${message_date.getFullYear()}`;    
                message_list.append(date_separator);
                
                //set last date
                last_message_date = new Date(format_str);
            }

            //check for last message date
            //create date obj without timestamp for comparison
            date = new Date(format_str);

            if (date > last_message_date){
                date_separator = document.createElement('div');
                date_separator.id = id_format_str;
                date_separator.className = 'chat-date-separator';
                date_separator.innerHTML = `${message_date.toLocaleString('default', { month: 'short' })}. ${message_date.getDate()}, ${message_date.getFullYear()}`;    
                message_list.append(date_separator);
                
                //set last date
                last_message_date = new Date(format_str);
            }

            message_div = document.createElement('div');

            if (message.sender == user.username) {
                message_div.className = 'chat-message-right mb-4';
            }
            else {
                message_div.className = 'chat-message-left mb-4';
            }
            
            message_div.innerHTML = `
                <div>
                    <a href="javascript:void(0)"><i class="fas fa-user-circle"></i></a>
                    <div class="text-muted  text-nowrap mt-2">${formatAMPM(message_date)}</div>
                </div>
                <div class="chat-text flex-shrink-1 chat-item rounded py-2 px-3 mr-3">
                    <div class="font-weight-semibold mb-1 chat-text-username">${message.sender}</div>
                    ${message.message}
                </div>
            `;

            message_list.append(message_div);

        });

        //scroll to bottom
        $('#message-list').animate({ scrollTop: $('#message-list').prop("scrollHeight")}, 1000);

        contact_chat_badge = document.querySelector(`#contact-badge-${element.dataset.chat}`);
        if(parseInt(contact_chat_badge.dataset.badge) > 0){
            badge_count = await set_messages_status(element.dataset.chat);
        }

        //remove any new unsaved chats
        new_chats = document.querySelectorAll('.new-chat');
        new_chats.forEach(element => {
            element.remove();
        });
    }
    //toggle chat sidebox 
    $('.chat-wrapper').toggleClass('chat-sidebox-open');

    set_menu_badge(badge_count);

    

}

async function request_chat(chat, page, order) {
    var response_data = null;
    const request = new Request(
        `/chat/${chat}/messages?page=${page}&order=${order}`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    await fetch(request, {
        method: 'GET',
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        if (!data.error) {
            response_data = data;
        }
	})
    .catch(error => {
        console.error( error);
    });

    return response_data;
} 

async function set_messages_status(chat) {
    count = null;
    const request = new Request(
        `/chat/${chat}/status`,
        {headers: {'X-CSRFToken': csrftoken}}
    );

    await fetch(request, {
        method: 'POST',
        body: JSON.stringify({read:'True'}),
        "mode": "same-origin"
    })
    .then(response => response.json())
	.then(data => {
        if (data.error) {
            console.log(data);
        }

        if (data.success) {
            contact_chat_badge = document.querySelector(`#contact-badge-${chat}`);
            contact_chat_badge.innerHTML = "";
            contact_chat_badge.dataset.badge = 0;

            count = data.total_unread_count;
        }
	})
    .catch(error => {
        console.error( error);
    });

    return count;
}

//https://stackoverflow.com/questions/8888491/how-do-you-display-javascript-datetime-in-12-hour-am-pm-format
function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

  
function insertAfter(newNode, existingNode) {
    existingNode.parentNode.insertBefore(newNode,            existingNode.nextSibling);
}
  
function set_menu_badge(badge_count){
    //update messages menu item badge
    if ((badge_count != null) && (badge_count > 0)) {
        menu_badges = document.querySelectorAll('.m-badge');

        menu_badges.forEach((item, index) => {
            item.innerHTML = badge_count;

            // for reduced size menu badge
            if (index == 0) {
                $(item).addClass('menu-icon-badge');
            }
        });

        
    }

    if (badge_count == 0) {
        menu_badges = document.querySelectorAll('.m-badge');

        menu_badges.forEach((item, index) => {
            item.innerHTML = '';

            // for reduced size menu badge
            if (index == 0) {
                $(item).removeClass('menu-icon-badge');
            }
        });
        
    }
}

Element.prototype.insertChildAtIndex = function(child, index) {
    if (!index) index = 0
    if (index >= this.children.length) {
      this.appendChild(child)
    } else {
      this.insertBefore(child, this.children[index])
    }
  }

