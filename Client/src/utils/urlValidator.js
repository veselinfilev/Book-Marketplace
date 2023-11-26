const isValidUrl = (url) => {
    const urlRegex = /^(http|https):\/\/.+$/;

    return urlRegex.test(url);
}

export default isValidUrl