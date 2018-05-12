/****************************************
 * Matrix/vector operations
 ****************************************/

/* Multiplies two (row-major) matrices or a matrix and a vector.
 * a and b must be multipliable; their dimensions are not checked
 * beforehand. */
function mul(a, b) {
    var result = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
        result[i] = new Array(b[0].length);
        for (var j = 0; j < b[0].length; j++) {
            var sum = 0;
            for (var m = 0; m < b.length; m++) {
                sum += a[i][m] * b[m][j];
            }
            result[i][j] = sum;
        }
    }
    return result;
}

/* Applies a function to each element in a matrix and returns the matrix of the results */
function apply(f, m) {
    var result = new Array(a.length);
    for (var i = 0; i < m.length; i++) {
        result[i] = new Array(m[0].length);
        for (var j = 0; j < m[0].length; j++) {
            result[i][j] = f(m[i][j]);
        }
    }
    return result;
}

/* Applies a function to each pair of corresponding elements in a and b and
 * returns the matrix of their results.
 * a and b must have the same dimensions; their dimensions are not checked
 * beforehand. */
function combine(f, a, b) {
    var result = new Array(a.length);
    for (var i = 0; i < a.length; i++) {
        result[i] = new Array(a[0].length);
        for (var j = 0; j < a[0].length; j++) {
            result[i][j] = f(a[i][j], b[i][j]);
        }
    }
    return result;
}

/* Finds the sum of two (row-major) matrices */
function add(a, b) {
    return combine(function(a, b) { return a + b; }, a, b);
}

/* Finds the difference of two (row-major) matrices (a - b) */
function sub(a, b) {
    return combine(function(a, b) { return a - b; }, a, b);
}

/* Finds the elementwise product of two (row-major) matrices] */
function mulElementwise(a, b) {
    return combine(function(a, b) { return a * b; }, a, b);
}

/* Transposes a matrix. Given an n by m matrix, returns an m by n matrix. */
function transpose(m) {
    var result = new Array(m[0].length);
    for (var i = 0; i < m[0].length; i++) {
        result[i] = new Array(m.length);
        for (var j = 0; j < m.length; j++) {
            result[i][j] = m[j][i];
        }
    }
    return result;
}


/****************************************
 * Data loading and processing
 ****************************************/

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
    
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        
        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
    
    return array;
}

/* Return a tuple containing (trainingData, validationData, testData). Each is
 * a list of tuples (x, y), where x is a 4-dimensional row-major vector
 * containing
 *     1. sepal length
 *     2. sepal width
 *     3. petal length
 *     4. petal width
 * each normalized to the range [0, 1] based on the minimum and maximum value
 * of the attribute, and y is a 3-dimensional row-major vector with one
 * element set to 1.0 and the other two set to 0.0 indicating the class of the
 * element:
 *     1. Iris setosa
 *     2. Iris versicolor
 *     3. Iris virginica
 */
function loadData(dataString) {
    data = [];
    minFeatures = [Infinity, Infinity, Infinity, Infinity];
    maxFeatures = [0.0, 0.0, 0.0, 0.0];
    labels = {"Iris-setosa": 0, "Iris-versicolor": 1, "Iris-virginica": 2};
    
    // convert string to vectors of floating-point data
    for (line of dataString.split("\n")) {
        if (line.length > 0) {
            var substrings = line.split(",");
            
            var featureVector = []
            for (var i = 0; i < substrings.length - 1; i++) {
                featureValue = parseFloat(substrings[i]);
                featureVector.push([featureValue]);
                if (featureValue < minFeatures[i]) {
                    minFeatures[i] = featureValue;
                } else if (featureValue > maxFeatures[i]) {
                    maxFeatures[i] = featureValue;
                }
            }
            
            var labelVector = new Array(Object.keys(labels).length).fill([0.0]);
            labelVector[labels[substrings[substrings.length - 1]]] = [1.0];
            
            data.push({features: featureVector, label: labelVector});
        }
    }
    
    // preprocessing (normalization)
    var featureRanges = [];
    for (var i = 0; i < minFeatures.length; i++) {
        featureRanges.push(maxFeatures[i] - minFeatures[i]);
    }
    for (var i = 0; i < data.length; i++) {
        for (var featureIndex = 0; featureIndex < data[i].features.length; featureIndex++) {
            data[i].features[featureIndex][0] = (data[i].features[featureIndex][0] - minFeatures[featureIndex]) / featureRanges[featureIndex];
        }
    }
    
    shuffle(data);
    return {
        trainingData:   data.slice(0, Math.floor(data.length * 0.6)),
        validationData: data.slice(Math.floor(data.length * 0.6), Math.floor(data.length * 0.8)),
        testData:       data.slice(Math.floor(data.length * 0.8))
    };
}
