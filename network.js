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
    var result = new Array(m.length);
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

/* Initializes an n by m matrix with random values between -1.0 and 1.0 */
function randomMatrix(n, m) {
    var result = new Array(n);
    for (var i = 0; i < n; i++) {
        result[i] = new Array(m);
        for (var j = 0; j < m; j++) {
            result[i][j] = 0.0;//Math.random() * 2.0 - 1.0;
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
    
//    shuffle(data);
    return {
        trainingData:   data.slice(0, Math.floor(data.length * 0.6)),
        validationData: data.slice(Math.floor(data.length * 0.6), Math.floor(data.length * 0.8)),
        testData:       data.slice(Math.floor(data.length * 0.8))
    };
}


/****************************************
 * Neural network
 ****************************************/

function sigmoid(p) {
    return 1.0 / (1.0 + Math.exp(-p));
}

function sigmoidPrime(p) {
    var sigmoid_p = sigmoid(p);
    return sigmoid_p * (1.0 - sigmoid_p);
}

/* Returns the index of the largest component in a (row-major) vector.
 * v must have at least one compoenent. */
function maxComponent(v) {
    var indexOfMax = 0;
    var max = v[0][0];
    for (var i = 1; i < v.length; i++) {
        var value = v[i][0];
        if (value > max) {
            max = value;
            indexOfMax = i;
        }
    }
    return indexOfMax;
}

class Network {
    
    constructor(sizes) {
        this.numLayers = sizes.length;
        
        // each weight matrix is indexed such that w[i][j] is the weight from
        // the jth neuron to the ith neuron
        this.weights = [];
        // weights from the "bias neuron" (which always has an implicit
        // activation of 1.0) to the neurons in each layer
        this.biases = [];
        
        for (var l = 1; l < sizes.length; l++) {
            this.weights.push(randomMatrix(sizes[l], sizes[l-1]));
            this.biases.push(randomMatrix(sizes[l], 1));
        }
    }
    
    /* Feeds the input vector through the network and returns the vector of
     output activations */
    feedForward(input) {
        var output = input;
        for (var i = 0; i < this.numLayers - 1; i++) {
            output = apply(sigmoid, add(mul(this.weights[i], output), this.biases[i]));
        }
        return output;
    }
    
    /* Performs backpropagation and returns an object {changeWeights,
     changeBiases} where changeWeights is a list describing the amount to
     change the weights of each layer (the rate of change of the error, not
     including the learning rate) and changeBiases is similarly for the
     biases */
    backprop(input, expectedOutput) {
        // forward propagation
        // like feedForward(), but potentials and outputs for each neuron are saved
        var potentials = []; // list of vectors of potentials for each layer
        var outputs = [input]; // list of vectors of output activations for each layer
        var output = input;
        for (var i = 0; i < this.numLayers - 1; i++) {
            var potentialVector = add(mul(this.weights[i], output), this.biases[i]);
            potentials.push(potentialVector);
            output = apply(sigmoid, potentialVector);
            outputs.push(output);
        }
        
        // backward propagation
        
        var changeWeights = new Array(this.numLayers - 1);
        var changeBiases  = new Array(this.numLayers - 1);
        
        // calculation of error
        var delta = mulElementwise(apply(sigmoidPrime, potentials[potentials.length - 1]), sub(expectedOutput, output));
        
        // rate of change of the error (not including the learning rate)
        changeWeights[changeWeights.length - 1] = mul(delta, transpose(outputs[outputs.length - 2]));
        changeBiases[changeBiases.length - 1] = delta; // bias neuron has an implicit activation of 1.0, so there's no need to multiply
        
        for (var l = 2; l < this.numLayers; l++) {
            // contribution to the error by hidden neurons
            delta = mulElementwise(apply(sigmoidPrime, potentials[potentials.length - l]), mul(transpose(this.weights[this.weights.length - l + 1]), delta));
            
            // rate of change of the error (not including the learning rate)
            changeWeights[changeWeights.length - l] = mul(delta, transpose(outputs[outputs.length - l - 1]));
            changeBiases[changeBiases.length - l] = delta; // bias neuron has an implicit activation of 1.0, so there's no need to multiply
        }
        
        return {changeWeights: changeWeights, changeBiases: changeBiases};
    }
    
    /* Performs backpropagation and updates the weights and biases according to
     the learning rate eta */
    backpropAndUpdate(input, expectedOutput, eta) {
        var backpropResults = this.backprop(input, expectedOutput);
        for (var l = 0; l < this.numLayers - 1; l++) {
            // update weights and biases according to eta and rates of change
            this.weights[l] = add(this.weights[l], apply(function (w) { return eta * w; }, backpropResults.changeWeights[l]));
            this.biases[l] = add(this.biases[l], apply(function (b) { return eta * b; }, backpropResults.changeBiases[l]));
        }
    }
    
    /* Trains the network on trainingData, printing accuracy results on
     validationData, until either the average total error over all the
     validationData is below targetError (default 0.02) or the average total
     error increases by a factor of maxFluctuation (default 0.7) over the
     minimum average total error so far */
    train(trainingData, validationData, eta, targetError=0.02, maxFluctuation=0.7) {
        var avgTotalError = Infinity;
        var minAvgTotalError = Infinity;
        
        for (var epoch = 0; epoch < 10000; epoch++) {
            if (avgTotalError < targetError) {
                console.log("Training stopped (avg. total error below " + targetError + ")");
                return;
            }
            if ((avgTotalError / minAvgTotalError) > (1.0 + maxFluctuation)) {
                console.log("Training stopped (avg. total error beginning to increase)");
                return;
            }
            
            // run backpropagation 10 times before checking validation data
            for (var i = 0; i < 10; i++) {
//                var example = trainingData[Math.floor(Math.random() * trainingData.length)];
                var example = trainingData[(epoch * 10 + i) % trainingData.length];
                this.backpropAndUpdate(example.features, example.label, eta);
            }
            
            // calculate accuracy on validation data
            var numCorrect = 0;
            var avgTotalError = 0;
            for (var v of validationData) {
                var vOutput = this.feedForward(v.features);
                if (maxComponent(v.label) == maxComponent(vOutput)) {
                    numCorrect += 1;
                }
                for (var i = 0; i < vOutput.length; i++) {
                    avgTotalError += 0.5 * Math.pow(v.label[i][0] - vOutput[i][0], 2);
                }
            }
            avgTotalError /= validationData.length;
            if (avgTotalError < minAvgTotalError) {
                minAvgTotalError = avgTotalError;
            }
            console.log("Epoch " + epoch + ": " + Math.floor(numCorrect * 100 / validationData.length) + "% accurate on validation set, avg. total error = " + avgTotalError);
        }
        
        console.log("Training stopped (max iterations reached)");
    }
}
