
function getInner(value) {
    return new Promise(function (resolve, reject) {
        setTimeout(function (value) {
            resolve(value);
        }, 1000, [value, "不明白", "是啥"]);
    })
}

function lastAync(value) {
    return new Promise(function (resolve, reject) {
        setTimeout(function (value) {
            resolve(value);
        }, 1000, value);
    })
}

// console.log(getInner());b

function getPromise() {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
            console.log("第一层");
            resolve("不搜");
            // resolve("pp");

        }, 1000);
    })
}

function lala() {
    return getPromise()
        .then(function (x) {
            console.log(x)
            return getInner(x).then(function (thirdArray) {
                // console.log("ks");
                var ksArray = thirdArray.map(function (value, index) {
                    // console.log(value);
                    return lastAync(value);
                })
                return Promise.all(ksArray);
            });
        }).then(function (t) {
            console.log(t);
        }).then(function (k) {
            console.log("你好");
        })
}


function TurnAround(singger) {
    this.singing = singger;
}

var t = [["1", ["a", "b", "c", "d"]], ["2", ["xx", "yy", "zz", "dd"]]];


function test() {

    var tArray = t.map(function (value, index) {
        var innerArray = value[1];
        var inPA = innerArray.map(function (value, index) {
            return lala();
        })
        return Promise.all(inPA);
    })
    return Promise.all(tArray)
}


test();


//设置了 http only 的 cookie 是无法被 JavaScript 获取的
res.cookie('oauth_token_secret', oauth_token_secret, { httpOnly: true });