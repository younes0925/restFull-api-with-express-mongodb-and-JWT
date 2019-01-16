module.exports={
    generateSecureCode :function(passwordLength) {
        var numberChars = "numberChars";
        var upperChars = "upperChars";
        var lowerChars = "lowerChars";
        var allChars = numberChars + upperChars + lowerChars;
        var randPasswordArray = Array(passwordLength);
        randPasswordArray[0] = numberChars;
        randPasswordArray[1] = upperChars;
        randPasswordArray[2] = lowerChars;
        randPasswordArray = randPasswordArray.fill(allChars, 3);
        return module.exports.shuffleArray(randPasswordArray.map(function(x) { return x[Math.floor(Math.random() * x.length)] })).join('');
    },

    shuffleArray: function (array) {
        for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        }
        return array;
    }
}
