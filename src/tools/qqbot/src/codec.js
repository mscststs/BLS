'use strict';

function hashU(x, K) {
    let N, T, U, V;
    x += '';
    for (N = [], T = 0; T < K.length; T++)
        N[T % 4] ^= K.charCodeAt(T);
    U = ['EC', 'OK'];
    V = [];
    V[0] = x >> 24 & 255 ^ U[0].charCodeAt(0);
    V[1] = x >> 16 & 255 ^ U[0].charCodeAt(1);
    V[2] = x >> 8 & 255 ^ U[1].charCodeAt(0);
    V[3] = x & 255 ^ U[1].charCodeAt(1);
    U = [];
    for (T = 0; T < 8; T++)
        U[T] = T % 2 == 0 ? N[T >> 1] : V[T >> 1];
    N = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'];
    V = '';
    for (T = 0; T < U.length; T++) {
        V += N[U[T] >> 4 & 15];
        V += N[U[T] & 15];
    }
    return V;
}

/**
 * @argument {string} t qrsig
 * 解码 qrsig
 * 来自 imgcache.qq.com/ptlogin/ver/10199/js/mq_comm.js sys.pt.hash33
 */
function decodeQrsig(t) {
    for (var e = 0, i = 0, n = t.length; n > i; ++i)
        e += (e << 5) + t.charCodeAt(i);
    return 2147483647 & e;
}

function randPgv() {
    let s = (new Date).getUTCMilliseconds();
    return (Math.round(Math.abs(Math.random() - 1) * 2147483647) * s % 10000000000);
}

export default {
    hashU: hashU,
    decodeQrsig: decodeQrsig,
    randPgv: randPgv
};
