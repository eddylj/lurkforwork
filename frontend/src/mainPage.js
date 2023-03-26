import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl, loadPage, initPost } from './helpers.js';

// Global Variables
let token = null;
let authID = null;
let startIndex = 0;
let loading = false;
let allowNotifs = false;
let currPostIds = [];
let disconnected = false;
let colorMode = true;

window.addEventListener("scroll", () => {
	const mainPage = document.getElementById("main-page");
	if (mainPage.style.display === "" && navigator.onLine) {
		const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
		if (scrollTop + clientHeight >= scrollHeight && !loading && !disconnected) {
			loading = true;
			startIndex += 5;
			showFeed(startIndex);
			loading = false;
		}
	}
});

function fetchGetUserData(user) {
	return fetch(`http://localhost:${BACKEND_PORT}/user?userId=${user}`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		}
	})
		.then(response => response.json())
}

// Opens initial page in login screen
loadPage("login-screen");

// Initialise nav bar buttons
document.getElementById("nav-logo-span").addEventListener("click", () => {
	showFeedStart();
});
document.getElementById("nav-home-button").addEventListener("click", () => {
	showFeedStart();
});
document.getElementById("nav-profile-button").addEventListener("click", () => {
	loadProfileScreen(authID);
});

////////////////////////
///// 2.1.1 Login //////
////////////////////////

const loginForm = document.forms.login_form;

document.getElementById("btn-join").addEventListener("click", (event) => {
	event.preventDefault();
	loadPage("rego-screen");
})

document.getElementById("btn-login").addEventListener("click", (event) => {
	event.preventDefault();
	const loginEmail = loginForm.login_email.value;
	const loginPw = loginForm.login_pw.value;

	const requestBody = {
		"email": loginEmail,
		"password": loginPw
	}
	fetch(`http://localhost:${BACKEND_PORT}/auth/login`, initPost(requestBody))
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				errorOrSuccessPopup("Please enter a valid email or password.", false);
			}
			else {
				token = data.token;
				authID = data.userId;
				// Load main page after login
				showFeedStart();
			}
		});
});

//////////////////////////////
///// 2.1.2 Registration /////
//////////////////////////////

// Variables
const regoForm = document.forms.rego_form;

// Back to login
document.getElementById("btn-signin").addEventListener("click", (event) => {
	event.preventDefault();
	loadPage("login-screen");
});

function isValidRegoEmail(email) {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function isValidRegoName(name) {
	const nameRegex = /^[a-zA-Z\s]+$/;
	return nameRegex.test(name);
}

// Register account
document.getElementById("btn-register").addEventListener("click", (event) => {
	event.preventDefault();

	let regoEmail = regoForm.rego_email.value;
	let regoName = regoForm.rego_name.value;
	let regoPw = regoForm.rego_pw.value;
	let regoConfirmPw = regoForm.rego_confirm_pw.value;

	if (!isValidRegoEmail(regoEmail)) {
		errorOrSuccessPopup("Please enter a valid email.", false);
		return;
	}

	if (!isValidRegoName(regoName)) {
		errorOrSuccessPopup("Please enter a valid name. Names must contain only letters and spaces.", false);
		return;
	}

	if (!regoPw) {
		errorOrSuccessPopup("Please enter a password", false)
		return;
	}

	if (regoPw !== regoConfirmPw) {
		errorOrSuccessPopup("Please ensure passwords match", false)
		return;
	}

	const requestBody = {
		"email": regoEmail,
		"password": regoPw,
		"name": regoName
	}
	fetch(`http://localhost:${BACKEND_PORT}/auth/register`, initPost(requestBody))
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				errorOrSuccessPopup("Email address already taken. Please enter a different email.", false);
			} else {
				errorOrSuccessPopup("Registration successful! Please log in.", true);
				// Load login after successful registration
				loadPage("login-screen");
			}
		});
});

//////////////////////////////
///// 2.1.3 Error Popup //////
//////////////////////////////

// Create a generic popup
// Returns the popup content to append children to
function showPopup() {
	const popup = document.getElementById("generic-popup");
	const popupContent = document.getElementById("generic-popup-content");
	const closePopupSpan = document.getElementById("generic-close-span");

	// Hide the popup when closed
	closePopupSpan.addEventListener('click', () => {
		popup.style.display = "None";
	});

	// Clear previous text from popup
	while (popupContent.childNodes.length > 2) {
		popupContent.removeChild(popupContent.lastChild);
	}
	popup.style.display = "block";
	return popupContent;
}

// Used for simple one line popups
// Returns an h3 element and an icon if requested
function makePopupHeader(headerText, headerIconClass) {
	const popupHeader = document.createElement("h3");
	popupHeader.innerText = headerText;
	if (headerIconClass) {
		const popupHeaderIcon = document.createElement("i");
		popupHeaderIcon.setAttribute("class", headerIconClass);
		popupHeader.appendChild(popupHeaderIcon);
	}
	return popupHeader;
}

// Creates either an error or success popup with inputted message as text
function errorOrSuccessPopup(message, success) {
	const popupContent = showPopup();
	const popupHeader = document.createElement("h3");
	const popupHeaderIcon = document.createElement("i");

	if (success) {
		popupHeader.innerText = "SUCCESS!";
		popupHeaderIcon.setAttribute("class", "fa-solid fa-check");
		popupHeader.style.color = "green";
	}
	else {
		popupHeader.innerText = "ERROR!";
		popupHeaderIcon.setAttribute("class", "fa-solid fa-triangle-exclamation");
		popupHeader.style.color = "rgb(155, 10, 10)";
	}
	popupContent.appendChild(popupHeader);
	popupContent.appendChild(popupHeaderIcon);
	const popupMessage = document.createElement("span");
	popupMessage.innerText = ` ${message}`;

	popupContent.appendChild(popupMessage);
}

//////////////////////////////
///// 2.2.1 Basic Feed ///////
////////////////////////////// TODO: MAKE SURE TO SHOW IN REVERSE CHRONOLOGICAL

function showFeedStart() {
	// Whenever feed is accessed, reset watchEmail input to hidden and empty
	watchEmailInput.style.display = "none";
	watchEmailInput.value = "";

	// If offline, then show latest cached feed
	if (disconnected) {
		if (document.getElementById("main-page").style.display === "none") {
			loadCachedFeed(authID);
		}
		return;
	}

	// Remove previous job posts
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});

	startIndex = 0;
	showFeed(startIndex);
}


// Main function to show feed.
function showFeed(startIndexNum) {
	loadPage("main-page");
	// Get the job feed
	const init = {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	}
	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=${startIndexNum}`, init)
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Cache in local storage if most recent feed
				if (startIndexNum === 0) {
					localStorage.setItem(authID, JSON.stringify(data));
				}
				for (const jobPost of data) {
					if (!currPostIds.includes(jobPost.id)) currPostIds.push(jobPost.id);
					generatePost(jobPost);
				}
			}
		})
}

// Changes iso date to DD/MM/YYYY format
function isoToNormalDate(date) {
	return `${date.substring(8, 10)}/${date.substring(5, 7)}/${date.substring(0, 4)}`;
}

/**
 * @param {Date} date object
 * @returns {string} date string according to spec:
 * If the job was posted today (in the last 24 hours), it should display how 
 * many hours and minutes ago it was posted 
 * If the job was posted more than 24 hours ago, it should just display the 
 * date DD/MM/YYYY that it was posted
 */
function jobPostCreateDate(date) {
	const isoDate = new Date(date);
	const nowDate = new Date();
	const timeSince = nowDate.getTime() - isoDate.getTime();
	const hoursSince = Math.floor(timeSince / (1000 * 60 * 60));

	if (hoursSince < 24) {
		const minutesSince = Math.floor(timeSince / (1000 * 60) % 60);
		return hoursSince === 0 ? `${minutesSince} min ago` : `${hoursSince} hrs ${minutesSince} min ago`;
	}
	else {
		return isoToNormalDate(date);
	}
}

/**
 * Generates a singular job post on main feed including the creator's name, date 
 * posted, post content and like and comment bars
 */
function generatePost(jobPost) {
	// Create Container for job post
	const jobContainer = document.createElement("div");
	jobContainer.setAttribute("class", "job-post");
	jobContainer.setAttribute("id", `jobPost${jobPost.id}`);

	// Creates creator name
	const creatorSpan = document.createElement("span");
	creatorSpan.setAttribute("class", "hover-underline");
	creatorSpan.addEventListener("click", () => loadProfileScreen(jobPost.creatorId));
	fetchGetUserData(jobPost.creatorId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			// Links the creator's name to their profile
			creatorSpan.innerText = data.name;
			localStorage.setItem(`id: ${jobPost.id}`, data.name);
		}
	})
	jobContainer.appendChild(creatorSpan);

	// Formats the date posted
	const jobDateDiv = document.createElement("div");
	const jobDate = document.createElement("p");
	jobDate.innerText = jobPostCreateDate(jobPost.createdAt);
	jobDate.style.color = "grey";
	jobDateDiv.appendChild(jobDate);
	jobContainer.appendChild(jobDateDiv);

	const jobContent = createJobContent(jobPost);
	jobContainer.appendChild(jobContent);

	const likeCommentBar = document.createElement("div");
	likeCommentBar.setAttribute("class", "likes-comments-bar");

	const likesDiv = document.createElement("div");
	likesDiv.setAttribute("class", "likes");

	const likeSpan = document.createElement("span");
	// Check if post has been liked by current user and set dynamic like button
	const isLiked = jobPost.likes.some((user) => user.userId === authID);
	const likeIcon = document.createElement("i");
	if (isLiked) {
		likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
		likeSpan.setAttribute("liked", "");
	}
	else {
		likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
		likeSpan.removeAttribute("liked");
	}
	likeSpan.appendChild(likeIcon);
	likeSpan.setAttribute("id", `${authID}${jobPost.id}`);
	likeSpan.addEventListener("click", () => likePost(jobPost.id, `${authID}${jobPost.id}`, likeIcon));

	const numLikes = document.createElement("p");
	numLikes.setAttribute("id", `numLikes${jobPost.id}`)
	numLikes.innerText = `  ${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");

	// Like section
	const likeSection = document.createElement("div");
	likeSection.setAttribute("id", `likes${jobPost.id}`);
	generateLikes(likeSection, jobPost.likes);

	numLikes.addEventListener("click", () => displayLikes(likeSection));

	likesDiv.appendChild(likeSpan);
	likesDiv.appendChild(numLikes);
	likesDiv.style.marginTop = "8px";

	const numComments = document.createElement("p");
	numComments.setAttribute("id", `numComments${jobPost.id}`);
	numComments.innerText = `${jobPost.comments.length} comments`;

	likeCommentBar.appendChild(likesDiv);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	const commentSection = document.createElement("div");
	commentSection.setAttribute("id", `comments${jobPost.id}`);
	generateComments(commentSection, jobPost.comments);
	jobContainer.appendChild(commentSection);

	const postCommentDiv = document.createElement("div");
	postCommentDiv.setAttribute("class", "post-comment-div");

	const addComment = document.createElement("input");
	addComment.setAttribute("placeholder", "Add a comment...");
	addComment.setAttribute("class", "comment-input");

	const postCommentBtn = document.createElement("button");
	postCommentBtn.setAttribute("class", "post-comment-button");
	postCommentBtn.innerText = "Post";
	postCommentBtn.addEventListener("click", () => {
		// Disallow empty comments
		if (!addComment.value) {
			return;
		}

		const requestBody = {
			"id": jobPost.id,
			"comment": addComment.value
		}
		fetch(`http://localhost:${BACKEND_PORT}/job/comment`, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token,
			},
			body: JSON.stringify(requestBody)
		})
			.then(response => response.json())
			.then(data => {
				if (data.error) {
					alert(data.error);
				} else {
					addComment.value = "";
				}
			});
	});

	postCommentDiv.appendChild(addComment);
	postCommentDiv.appendChild(postCommentBtn);
	jobContainer.appendChild(postCommentDiv);

	document.getElementById("main-page").appendChild(jobContainer);
}

function createJobContent(jobPost) {
	const jobContent = document.createElement("div");
	jobContent.setAttribute("class", "job-content");

	const jobImg = document.createElement("img");
	jobImg.setAttribute("class", "job-img");
	jobImg.src = jobPost.image;
	jobContent.appendChild(jobImg);

	const jobDescription = document.createElement("div");
	jobDescription.setAttribute("class", "job-description");
	const descriptionTitle = document.createElement("h5");
	descriptionTitle.innerText = `${jobPost.title}`;
	jobDescription.appendChild(descriptionTitle);

	const brNode = document.createElement("br");
	jobDescription.appendChild(brNode);

	const jobStartDate = document.createElement("div");
	jobStartDate.innerText = `Starting ${isoToNormalDate(jobPost.start)}`;;
	jobDescription.appendChild(jobStartDate);

	const brNode2 = document.createElement("br");
	jobDescription.appendChild(brNode2);

	const jobInfo = document.createElement("p");
	jobInfo.innerText = jobPost.description;
	jobDescription.appendChild(jobInfo);
	jobContent.appendChild(jobDescription);

	return jobContent;
}

////////////////////////////////////////
///// 2.3.1 Show Likes on a job ////////
////////////////////////////////////////

function generateLikes(likeSection, likeData) {
	for (const userInfo of likeData) {
		const user = document.createElement("span");
		user.setAttribute("class", "liked-user hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(userInfo.userId);
			document.getElementById("generic-popup").style.display = "None";
		});
		user.innerText = `${userInfo.userName} (${userInfo.userEmail})`
		likeSection.appendChild(user);
	}
}

function displayLikes(likeSection) {
	// Popup likes
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Likes ", "fa-solid fa-thumbs-up"));
	popupContent.appendChild(likeSection);
}

////////////////////////////////////////
///// 2.3.2 Show comments on a job /////
////////////////////////////////////////

function generateComments(commentSection, comments) {
	for (const commentInfo of comments) {
		const comment = document.createElement("div");
		comment.setAttribute("class", "comment");
		const commentUser = document.createElement("span");
		commentUser.innerText = commentInfo.userName;
		commentUser.setAttribute("class", "hover-underline");
		commentUser.addEventListener("click", () => loadProfileScreen(commentInfo.userId));
		comment.appendChild(commentUser);
		const commentContent = document.createElement("span");
		commentContent.setAttribute("class", "comment-content");
		commentContent.innerText = `: ${commentInfo.comment}`
		comment.appendChild(commentContent);
		commentSection.appendChild(comment);
	}
}

////////////////////////////////////////
///// 2.3.3 Liking a job ///////////////
////////////////////////////////////////

function likePost(postID, spanId, likeIcon) {
	const likeSpan = document.getElementById(spanId);
	const isLiked = likeSpan.hasAttribute("liked");

	const requestBody = {
		"id": postID,
		"turnon": !isLiked,
	}

	fetch(`http://localhost:${BACKEND_PORT}/job/like`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody),
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Change like icon fill
				if (isLiked) {
					likeSpan.removeAttribute("liked");
					likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
				}
				else {
					likeSpan.setAttribute("liked", "");
					likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
				}
			}
		})
}

////////////////////////////////////////
///// 2.4.1 Viewing Other Profiles /////
////////////////////////////////////////

function loadProfileScreen(userId) {
	fetchGetUserData(userId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (parseInt(userId) === authID) {
				generateProfile(data, true);
			} else {
				generateProfile(data, false);
			}
		}
	})
}

function generateProfile(userData, isOwnProfile) {
	loadPage("profile-page");

	const updateProfileDiv = document.getElementById("update-profile-div");

	if (isOwnProfile) updateProfileDiv.style.display = "";
	else updateProfileDiv.style.display = "none";

	document.getElementById("profile-name").innerText = userData.name;
	document.getElementById("profile-email").innerText = userData.email;

	let profileImg = document.getElementById("profile-img");
	// Sets a default image if no inputted user image
	if (userData.image === undefined) {
		profileImg.src = "images/defaultprofile.jpg";
	}
	else {
		profileImg.src = userData.image;
	}

	// Create num of watchees - do this so button doesn't stack up on multiple event listeners (remove curr first)
	let profileInfo = document.getElementById("profile-info");
	let numWatchers = document.getElementById("profile-num-watchers");
	profileInfo.removeChild(numWatchers);

	// Removes previous load watch button
	let watchButton = document.getElementById("watch-button");
	if (watchButton !== null) {
		profileInfo.removeChild(watchButton);
	}

	// Num watchers
	let newNumWatchers = document.createElement("span");
	newNumWatchers.setAttribute("class", "watchers-span hover-underline");
	newNumWatchers.setAttribute("id", "profile-num-watchers");
	newNumWatchers.innerText = `${userData.watcheeUserIds.length} watcher(s)`;
	newNumWatchers.addEventListener("click", () => displayWatchers(userData.watcheeUserIds));
	profileInfo.appendChild(newNumWatchers);

	// Add button to watch/unwatch
	let newWatchButton = document.createElement("button");
	newWatchButton.setAttribute("id", "watch-button");
	// Check if user is currently watching and update watch button
	const isWatched = userData.watcheeUserIds.some((watcher) => watcher === authID);
	if (isWatched) {
		newWatchButton.innerText = "✔️ Watching";
		newWatchButton.setAttribute("watching", "")
	}
	else {
		newWatchButton.innerText = "➕ Watch";
		newWatchButton.removeAttribute("watching")
	}
	newWatchButton.addEventListener("click", () => watchUser(userData.email, "watch-button"));
	profileInfo.appendChild(newWatchButton);

	// Create job
	// Button only appears on own profile
	if (isOwnProfile) {
		document.getElementById("create-job-container").style.display = "block";
	} else {
		document.getElementById("create-job-container").style.display = "None";
	}

	// Generate jobs
	// Delete previous load job postings first
	Array.from(document.getElementsByClassName("job-post")).forEach((jobPost) => {
		jobPost.remove();
	});
	const profilePage = document.getElementById("profile-page");
	userData.jobs.forEach((jobPost) => {
		const jobContainer = document.createElement("div");
		jobContainer.setAttribute("class", "job-post");

		// Create update and delete job buttons
		if (isOwnProfile) {
			const editJobButtonsFather = document.createElement("div");
			editJobButtonsFather.setAttribute("class", "edit-job-buttons-father");
			const editJobButtons = document.createElement("div");
			editJobButtons.setAttribute("class", "edit-job-buttons");

			const jobUpdateBtn = document.createElement("button");
			jobUpdateBtn.setAttribute("class", "small-media-button");
			jobUpdateBtn.innerText = "Update";
			// Add Event listener to update
			jobUpdateBtn.addEventListener("click", () => updateJob(jobPost));

			const jobDeleteBtn = document.createElement("button");
			jobDeleteBtn.setAttribute("class", "small-media-button");
			jobDeleteBtn.innerText = "Delete";
			// Add Event listener to delete job
			jobDeleteBtn.addEventListener("click", () => deleteJob(jobPost.id));

			editJobButtons.appendChild(jobUpdateBtn);
			editJobButtons.appendChild(jobDeleteBtn);
			editJobButtonsFather.appendChild(editJobButtons);
			jobContainer.appendChild(editJobButtonsFather);
		}
		const jobContent = createJobContent(jobPost);
		jobContainer.appendChild(jobContent);

		profilePage.appendChild(jobContainer);
	});
}

// Show watchers
function displayWatchers(watcheeIds) {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Watchers ", "fa-solid fa-eye"));

	for (const id of watcheeIds) {
		const user = document.createElement("span");
		user.setAttribute("class", "watcher hover-underline");
		user.addEventListener("click", () => {
			loadProfileScreen(id);
			document.getElementById("generic-popup").style.display = "None";
		});
		fetchGetUserData(id).then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				user.innerText = data.name;
			}
		})
		popupContent.appendChild(user);
	}
}

////////////////////////////////////////
///// 2.4.3 Updating your profile  /////
////////////////////////////////////////

function createInputDom(inputId, inputPlaceholder, inputType, inputAccept) {
	const newInput = document.createElement("input");
	newInput.setAttribute("id", inputId);
	newInput.setAttribute("placeholder", inputPlaceholder);
	newInput.setAttribute("type", inputType);
	newInput.setAttribute("accept", inputAccept);
	return newInput;
}

const updateProfileBtn = document.getElementById("update-profile-btn");
updateProfileBtn.addEventListener("click", () => {
	// Popup screen here
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Update Profile ", "fa-solid fa-user"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	inputDiv.appendChild(createInputDom("update-profile-name", "Name"));
	inputDiv.appendChild(createInputDom("update-profile-picture", undefined, "file", "image/png, image/jpg"));
	inputDiv.appendChild(createInputDom("update-profile-email", "Email"));
	inputDiv.appendChild(createInputDom("update-profile-password", "Password", "password"));
	inputDiv.appendChild(createInputDom("update-profile-confirm-password", "Confirm password", "password"));

	let updateProfileSubmitButton = document.createElement("button");
	updateProfileSubmitButton.innerText = "Submit";
	updateProfileSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(updateProfileSubmitButton);
	updateProfileSubmitButton.addEventListener("click", setUpdateProfileSubmitButton);

	popupContent.appendChild(inputDiv);

	// Fill out the popup info
	fetchGetUserData(authID).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			document.getElementById("update-profile-name").value = data.name;
			document.getElementById("update-profile-email").value = data.email;
		}
	})
});

function fetchPutUserData(requestBody) {
	fetch(`http://localhost:${BACKEND_PORT}/user`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// Close popup
				document.getElementById("generic-popup").style.display = "None";
				const popupContent = showPopup();
				let popupHeader = makePopupHeader("Profile update successful ", "fa-solid fa-check");
				popupHeader.style.color = "green";
				popupContent.appendChild(popupHeader);

			}
		})
}

// Add event listener to close button
function setUpdateProfileSubmitButton() {
	const name = document.getElementById("update-profile-name").value;
	const imgFile = document.querySelector("#update-profile-picture").files[0];
	const email = document.getElementById("update-profile-email").value;
	const password = document.getElementById("update-profile-password").value;
	const confirmPassword = document.getElementById("update-profile-confirm-password").value;

	// Check passwords are the same
	if (password !== confirmPassword) {
		errorOrSuccessPopup("Passwords don't match", false);
		return;
	}

	let requestBody = {
		"name": name,
		"password": password
	};

	fetchGetUserData(authID).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (email !== data.email) {
				fetchPutUserData({ "email": email });
			}
		}
	});

	if (imgFile) {
		fileToDataUrl(imgFile).then((img) => {
			Object.assign(requestBody, { "image": img });
			fetchPutUserData(requestBody);
		});
	}
	else {
		fetchPutUserData(requestBody);
	}
}

////////////////////////////////////////
///// 2.4.4 Watching/Unwatching  ///////
////////////////////////////////////////

// Watch Button
function watchUserFetchPut(requestBody) {
	return fetch(`http://localhost:${BACKEND_PORT}/user/watch`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json());
}


function watchUser(email, buttonId) {
	const watchButton = document.getElementById(buttonId);
	const isWatched = watchButton.hasAttribute("watching");
	const requestBody = {
		"email": email,
		"turnon": !isWatched
	}

	watchUserFetchPut(requestBody).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			if (isWatched) {
				watchButton.removeAttribute("watching");
				watchButton.innerText = "➕ Watch";
			}
			else {
				watchButton.setAttribute("watching", "");
				watchButton.innerText = "✔️ Watching";
			}
		}
	})
}

const watchEmailButton = document.getElementById("watch-email-button");
const watchEmailInput = document.getElementById("watch-email-input");

watchEmailButton.addEventListener("click", () => {
	watchEmailInput.style.display === "inline" ? watchEmailInput.style.display = "none" :
		watchEmailInput.style.display = "inline";
});

watchEmailInput.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		const requestBody = {
			"email": watchEmailInput.value,
			"turnon": true
		}
		watchUserFetchPut(requestBody).then(data => {
			if (data.error) {
				errorOrSuccessPopup("That email does not belong to an account", false);
			}
			else {
				errorOrSuccessPopup(`Now watching ${watchEmailInput.value}`, true);
				watchEmailInput.value = "";
			}
		});
	}
});

////////////////////////////////////////
///// 2.5.1 Adding a job  //////////////
////////////////////////////////////////

const createJobBtn = document.getElementById("create-job-btn");
createJobBtn.addEventListener("click", () => {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Create Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	const startDateInput = createInputDom("create-job-date-input", "Start date");
	startDateInput.addEventListener("focus", () => {
		startDateInput.type = "date";
	});
	inputDiv.appendChild(createInputDom("create-job-title-input", "Job title"));
	inputDiv.appendChild(createInputDom("create-job-img-input", undefined, "file", "image/jpg"));
	inputDiv.appendChild(startDateInput);
	inputDiv.appendChild(createInputDom("create-job-description-input", "Job description"));


	let createJobSubmitButton = document.createElement("button");
	createJobSubmitButton.innerText = "Submit";
	createJobSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(createJobSubmitButton);
	const errorSpan = document.createElement("span");
	errorSpan.setAttribute("id", "create-job-error");
	inputDiv.appendChild(errorSpan);
	popupContent.appendChild(inputDiv);

	createJobSubmitButton.addEventListener("click", () => {
		const jobTitle = document.getElementById("create-job-title-input").value;
		const jobImgFile = document.querySelector('#create-job-img-input').files[0];
		const jobDescription = document.getElementById("create-job-description-input").value;


		// Check everything is non-empty
		if (!jobTitle || !startDateInput.value || !jobImgFile) {
			let errorText = "";
			if (!jobTitle) errorText = "Please enter a job title";
			else if (!startDateInput.value) errorText = "Please enter a start date";
			else errorText = "Please upload an image";
			errorSpan.innerText = errorText;
			return;
		}
		fileToDataUrl(jobImgFile).then((img) => {
			const requestBody = {
				"title": jobTitle,
				"image": img,
				"start": new Date(startDateInput.value).toISOString().substring(0, 10),
				"description": jobDescription
			}

			fetch(`http://localhost:${BACKEND_PORT}/job`, {
				method: "POST",
				headers: {
					'Content-Type': 'application/json',
					'Authorization': token,
				},
				body: JSON.stringify(requestBody)
			})
				.then(response => response.json())
				.then(data => {
					if (data.error) {
						alert(data.error);
					} else {
						document.getElementById("generic-popup").style.display = "None";
						const popupContent = showPopup();
						let popupHeader = makePopupHeader("Job creation successful ", "fa-solid fa-check");
						popupHeader.style.color = "green";
						popupContent.appendChild(popupHeader);
					}
				})
		});
	});
});


///////////////////////////////////////////
///// 2.5.1 Updating and deleting a job ///
///////////////////////////////////////////

// Add event listener to close button
function updateJob(jobData) {
	const popupContent = showPopup();
	popupContent.appendChild(makePopupHeader("Update Job ", "fa-solid fa-briefcase"));

	const inputDiv = document.createElement("div");
	inputDiv.setAttribute("class", "popup-input-content");

	const titleInput = createInputDom("update-job-title-input", "Job title");
	const imgInput = createInputDom("update-job-img-input", undefined, "file", "image/jpg");
	const startDateInput = createInputDom("update-job-date-input", "", "date");
	const descriptInput = createInputDom("update-job-description-input", "Job description");
	titleInput.value = jobData.title;
	// const prevDateValue = ;
	startDateInput.value = new Date(jobData.start).toISOString().substring(0, 10);
	descriptInput.value = jobData.description;

	inputDiv.appendChild(titleInput);
	inputDiv.appendChild(imgInput);
	inputDiv.appendChild(startDateInput);
	inputDiv.appendChild(descriptInput);

	let updateJobSubmitButton = document.createElement("button");
	updateJobSubmitButton.innerText = "Submit";
	updateJobSubmitButton.setAttribute("class", "btn-submit");
	inputDiv.appendChild(updateJobSubmitButton);

	popupContent.appendChild(inputDiv);

	updateJobSubmitButton.addEventListener("click", () => {
		let requestBody = {
			"id": jobData.id,
			"title": titleInput.value,
			"start": startDateInput.value,
			"description": descriptInput.value
		};

		if (imgInput.files[0]) {
			fileToDataUrl(imgInput.files[0]).then((img) => {
				Object.assign(requestBody, { "image": img });
				fetchPutJobData(requestBody);
			});
		}
		else {
			fetchPutJobData(requestBody);
		}
	});
}

function fetchPutJobData(requestBody) {
	fetch(`http://localhost:${BACKEND_PORT}/job`, {
		method: "PUT",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				// document.getElementById("generic-popup").style.display = "None";
				const popupContent = showPopup();
				let popupHeader = makePopupHeader("Job update successful ", "fa-solid fa-check");
				popupHeader.style.color = "green";
				popupContent.appendChild(popupHeader);
			}
		})
}

function deleteJob(jobId) {
	const requestBody = {
		"id": jobId
	}
	fetch(`http://localhost:${BACKEND_PORT}/job`, {
		method: "DELETE",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token,
		},
		body: JSON.stringify(requestBody)
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				errorOrSuccessPopup("Job already deleted", false);
				alert(data.error);
			}
			else {
				errorOrSuccessPopup("Successfully deleted job", true);
			}
		})
}

///////////////////////////////////////////
///// 2.6.2 Live Update ///////////////////
///////////////////////////////////////////

setInterval(liveUpdate, 500);

function liveUpdate() {
	// Check the user is logged in
	if (authID === null) {
		return;
	}

	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=0`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				disconnected = false;
				for (const jobPost of data) {
					liveUpdateJobPost(jobPost);
				}
			}
		}).catch(() => {
			disconnected = true;
		})
}

function liveUpdateJobPost(jobPostData) {
	// Check job Post exsits - if doesn't - send push notif
	if (document.getElementById(`jobPost${jobPostData.id}`) === null) {
		pushNotifs();
		return;
	}

	// Update number of likes
	let numLikes = document.getElementById(`numLikes${jobPostData.id}`);
	numLikes.innerText = ` ${jobPostData.likes.length} likes`;

	// Update number of comments
	let numComments = document.getElementById(`numComments${jobPostData.id}`);
	numComments.innerText = `${jobPostData.comments.length} comments`;

	// Update comments
	const commentSection = document.getElementById(`comments${jobPostData.id}`);
	commentSection.textContent = "";
	generateComments(commentSection, jobPostData.comments);

	// Update Likes
	const likeSection = document.getElementById(`likes${jobPostData.id}`);
	if (likeSection === null) return;
	likeSection.textContent = "";
	generateLikes(likeSection, jobPostData.likes);
}

///////////////////////////////////////////
///// 2.6.3 Push Notifs ///////////////////
///////////////////////////////////////////

// Function to toggle notifs
document.getElementById("nav-toggle-notifs").addEventListener("click", () => {
	if (allowNotifs) {
		allowNotifs = false;
		document.getElementById("bell-icon").setAttribute("class", "fa-regular fa-bell-slash");
	} else {
		allowNotifs = true;
		document.getElementById("bell-icon").setAttribute("class", "fa-solid fa-bell");
	}
})

function pushNotifs() {
	// Maybe check if user has turned on notifs
	if (!allowNotifs) return;

	// Fetch last 5 job posts
	fetch(`http://localhost:${BACKEND_PORT}/job/feed?start=0`, {
		method: "GET",
		headers: {
			'Content-Type': 'application/json',
			'Authorization': token
		}
	})
		.then(response => response.json())
		.then(data => {
			if (data.error) {
				alert(data.error);
			} else {
				for (const jobPost of data) {
					if (!currPostIds.includes(jobPost.id)) {
						currPostIds.push(jobPost.id);
						// If you want to customise, chuck in data as argument

						newNotifPopup(jobPost);
					}
				}
			}
		})
}

document.getElementById("notif-close-span").addEventListener("click", () => {
	document.getElementById("notif-popup").style.display = "none";
});

document.getElementById("refresh-main-page").addEventListener("click", () => {
	document.getElementById("notif-popup").style.display = "none";
	showFeedStart();
});


function newNotifPopup(jobPost) {
	const notifPopup = document.getElementById("notif-popup");
	notifPopup.style.display = "block";
	const notifPopupContent = document.getElementById("notif-popup-content");
	let notifTextDiv = document.createElement("div");
	notifTextDiv.setAttribute("class", "notif-text-div")

	fetchGetUserData(jobPost.creatorId).then(data => {
		if (data.error) {
			alert(data.error);
		} else {
			notifTextDiv.innerText = `${data.name} has posted a job: ${jobPost.title} starting ${isoToNormalDate(jobPost.start)}`;
			notifPopupContent.appendChild(notifTextDiv);
		}
	});
}

///////////////////////////////////////////
///// 2.7.1 Static feed offline access/////
///////////////////////////////////////////
function loadCachedFeed() {
	loadPage("main-page");
	const dataString = localStorage.getItem(authID);
	let data = JSON.parse(dataString);
	for (const jobPost of data) {
		generatePostCached(jobPost);
	}
}


function generatePostCached(jobPost) {
	// Create Container for job post
	const jobContainer = document.createElement("div");
	jobContainer.setAttribute("class", "job-post");
	jobContainer.setAttribute("id", `jobPost${jobPost.id}`);
	// User name 
	const creatorSpan = document.createElement("span");
	creatorSpan.setAttribute("class", "hover-underline");
	creatorSpan.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet and refresh", false));

	creatorSpan.innerText = localStorage.getItem(`id: ${jobPost.id}`);

	// Job Post Date
	const jobDateDiv = document.createElement("div");
	const jobDate = document.createElement("p");
	jobDate.innerText = jobPostCreateDate(jobPost.createdAt);
	jobDate.style.color = "grey";
	jobDateDiv.appendChild(jobDate);

	jobContainer.appendChild(creatorSpan);
	jobContainer.appendChild(jobDateDiv);

	const jobContent = createJobContent(jobPost);
	jobContainer.appendChild(jobContent);

	// Likes and comments bar
	const likeCommentBar = document.createElement("div");
	likeCommentBar.setAttribute("class", "likes-comments-bar");

	const likesDiv = document.createElement("div");
	likesDiv.setAttribute("class", "likes");

	const likeSpan = document.createElement("span");
	// Check if post has been liked by current user
	const isLiked = jobPost.likes.some((user) => user.userId === authID);
	const likeIcon = document.createElement("i");
	if (isLiked) {
		likeIcon.setAttribute("class", "fa-solid fa-thumbs-up");
		likeSpan.setAttribute("liked", "");
	}
	else {
		likeIcon.setAttribute("class", "fa-regular fa-thumbs-up");
		likeSpan.removeAttribute("liked");
	}
	likeSpan.appendChild(likeIcon);

	likeSpan.setAttribute("id", `${authID}${jobPost.id}`);
	likeSpan.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet and refresh", false));

	// Number of likes
	const numLikes = document.createElement("p");
	numLikes.setAttribute("id", `numLikes${jobPost.id}`)
	numLikes.innerText = `  ${jobPost.likes.length} likes`
	numLikes.setAttribute("class", "hover-underline");

	// Like section
	const likeSection = document.createElement("div");
	likeSection.setAttribute("id", `likes${jobPost.id}`);
	generateLikes(likeSection, jobPost.likes);

	numLikes.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet and refresh", false));

	likesDiv.appendChild(likeSpan);
	likesDiv.appendChild(numLikes);

	const numComments = document.createElement("p");
	numComments.setAttribute("id", `numComments${jobPost.id}`);
	numComments.innerText = `${jobPost.comments.length} comments`;

	likeCommentBar.appendChild(likesDiv);
	likeCommentBar.appendChild(numComments);
	jobContainer.appendChild(likeCommentBar);

	const commentSection = document.createElement("div");
	commentSection.setAttribute("id", `comments${jobPost.id}`);

	generateComments(commentSection, jobPost.comments);
	jobContainer.appendChild(commentSection);

	// Post comment
	const postCommentDiv = document.createElement("div");
	postCommentDiv.setAttribute("class", "post-comment-div");

	const addComment = document.createElement("input");
	addComment.setAttribute("placeholder", "Add a comment");
	addComment.setAttribute("class", "comment-input");

	const postCommentBtn = document.createElement("button");
	postCommentBtn.setAttribute("class", "post-comment-button");
	postCommentBtn.innerText = "Post";
	postCommentBtn.addEventListener("click", () => errorOrSuccessPopup("You are offline, please connect to Internet", false));

	postCommentDiv.appendChild(addComment);
	postCommentDiv.appendChild(postCommentBtn);
	jobContainer.appendChild(postCommentDiv);

	// Append to main page
	document.getElementById("main-page").appendChild(jobContainer);
}

///////////////////////////////////////////
///// 2.7.2 Fragment based URL routing/////
///////////////////////////////////////////

function handleHashChange() {
	// get the hash fragment from the URL
	const hash = window.location.hash;
	// remove the #
	const route = hash.slice(1);
	if (route === 'feed') {
		showFeedStart();
	} else if (route.slice(0, 8) === 'profile=') {
		const userId = route.split("=")[1];
		loadProfileScreen(userId);
	} else if (route === 'register') {
		loadPage("rego-screen");
	} else if (route === 'login' || route === '') {
		loadPage("login-screen");
	}
	// else {
	// 	loadPage("error-page");
	// }
}

window.addEventListener('hashchange', handleHashChange);

// call the handleHashChange function once to handle the initial route
handleHashChange();

///////////////////////////////////////////
///// Bonus ///////////////////
///////////////////////////////////////////

// Logout button
const logoutButton = document.getElementById("nav-logout");
logoutButton.addEventListener("click", () => {
	if (!disconnected) {
		loginForm.login_email.value = "";
		loginForm.login_pw.value = "";
		token = null;
		authID = null;
		document.getElementById("generic-popup").style.display = "none";
		loadPage("login-screen");
	}
});

// Dark mode
const toggleDarkButton = document.getElementById("nav-toggle-dark");

toggleDarkButton.addEventListener("click", () => {
	document.documentElement.classList.toggle("dark-mode")
	if (colorMode === true) {
		document.getElementById("dark-mode-sun").style.display = "inline-block";
		document.getElementById("dark-mode-moon").style.display = "none";
		colorMode = false;
	}
	else {
		document.getElementById("dark-mode-sun").style.display = "none";
		document.getElementById("dark-mode-moon").style.display = "inline-block";
		colorMode = true;
	}
});
