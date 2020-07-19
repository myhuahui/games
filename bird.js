/**
 * 创建一个计时器
 * @param {*} duration //运行期间
 * @param {*} thisArg //绑定this指向
 * @param {*} callback //传回一个函数
 */
function setTime(duration, thisArg, callback) {
    var timer;
    return {
        start: function () {
            if (timer) {
                return;
            }
            timer = setInterval(callback.bind(thisArg), duration);
        },

        stop: function () {
            clearInterval(timer),
                timer = null;
        }
    }
}

function getMath(min, max) {
    return Math.floor(Math.random() * (max + 1 - min) + min);
}

/**
 * 创建一个游戏对象来存放信息
 */
var game = {
    dom: document.querySelector(".game"),
    isSupend: true,
    Over: document.querySelector(".game .over"),
    isOver: false,

    start: function () {
        sky.timer.start(); //开始天空的计时器
        land.timer.start(); //开始大地的计时器
        bird.wingTimer.start(); //开始小鸟煽动翅膀计时器
        bird.fallTimer.start(); //开始小鸟下坠计时器
        manage.timer.start(); //开始生产柱子计时器
        manage.moveTimer.start(); //开始柱子移动计时器
        checkForCollision.timer.start(); //开始检查是否碰撞
    },
    stop: function () {
        sky.timer.stop();
        land.timer.stop();
        bird.wingTimer.stop();
        bird.fallTimer.stop();
        manage.timer.stop();
        manage.moveTimer.stop();
        checkForCollision.timer.stop();
    }
}

game.width = game.dom.clientWidth;
game.height = game.dom.clientHeight;

/**
 * 创建一个天空对象
 */
var sky = {
    left: 0,
    dom: document.querySelector(".game .sky"),
}

sky.timer = setTime(16, sky, function () {
    this.left--;
    if (this.left < -game.width) {
        this.left = 0;
    }
    this.dom.style.left = this.left + "px";
});

/**
 * 创建大地对象
 */
var land = {
    dom: document.querySelector(".game .land"),
    left: 0,
}
land.height = land.dom.clientHeight; //得到视口宽度
land.top = game.height - land.height; //得到大地的纵坐标

land.timer = setTime(16, land, function () {
    this.left -= 2;
    if (this.left < -game.width) {
        this.left = 0;
    }

    this.dom.style.left = this.left + "px";
})

var bird = {
    dom: document.querySelector(".game .bird"),
    width: 32,
    height: 26,
    left: 150,
    top: 150,
    wingIndex: 0,
    a: 0.002, //重力速度
    v: 0, //当前速度
    t: 16, //运动期间

    show() {
        //处理小鸟的煽动翅膀
        if (bird.wingIndex === 0) {
            bird.dom.style.backgroundPosition = "-8px -10px"
        } else if (bird.wingIndex === 1) {
            bird.dom.style.backgroundPosition = "-60px -10px";
        } else {
            bird.dom.style.backgroundPosition = "-113px -10px"
        }
        this.dom.style.left = this.left + "px";
        this.dom.style.top = this.top + "px";
    },
    setTop(top) {
        if (top < 0) {
            top = 0;
        } else if (top > land.top - this.height) {
            top = land.top - this.height;
        }

        this.top = top;
        this.show();
    },
    jup() {
        this.v = -0.5;
        /* this.show(); */
    }
}

/**
 * 调用小鸟
 */
bird.show();

bird.wingTimer = setTime(200, bird, function () {
    this.wingIndex = (this.wingIndex + 1) % 3;
    this.show();
});

/*
计算小鸟的下坠速度
**/
bird.fallTimer = setTime(bird.t, bird, function () {
    var dis = this.v * this.t + 0.5 * this.a * this.t * this.t;
    this.v = this.v + this.a * this.t;
    this.setTop(this.top + dis);

})

/***
 * 柱子构造函数
 */
function Pipe(direction, height) {
    this.width = Pipe.width;
    this.left = game.width;
    this.height = height;
    this.direction = direction;
    if (direction === "up") {
        this.top = 0;
    } else {
        this.top = land.top - this.height;
    }

    this.dom = document.createElement("div");
    this.dom.className = "pipe " + direction;
    this.dom.style.height = this.height + "px";
    this.dom.style.top = this.top + "px";
    this.show();
    game.dom.appendChild(this.dom);
}

Pipe.prototype.show = function () {
    this.dom.style.left = this.left + "px";
}

/**
 * 创建一对柱子
 */
function PipePair() {
    var minTop = 60;
    var gap = 150;
    var maxTop = land.top - minTop - gap;
    var h = getMath(minTop, maxTop);
    this.up = new Pipe("up", h);
    this.down = new Pipe("down", land.top - h - gap);
    this.left = this.up.left;
}

/**
 * 显示一对柱子
 */
PipePair.prototype.show = function () {
    this.up.left = this.left;
    this.down.left = this.left;
    this.up.show();
    this.down.show();
}
/**
 * 移除一对柱子
 */
PipePair.prototype.remove = function () {
    this.up.dom.remove();
    this.down.dom.remove();
}

Pipe.width = 52;

/**
 * 创建一个数组来存放创建的柱子
 */
var manage = {
    pipe: [],
}

/**
 * 开始生产柱子计时器
 */
manage.timer = setTime(1500, manage, function () {
    this.pipe.push(new PipePair);
})

manage.moveTimer = setTime(16, manage, function () {
    for (var i = 0; i < this.pipe.length; i++) {
        var par = this.pipe[i];
        par.left -= 2;
        if (par.left <= -Pipe.width) {
            par.remove();
            this.pipe.splice(i, 1);
            i--;
        } else {
            par.show();
        }
    }
})

/**
 * 检查碰撞器
 */
var checkForCollision = {
    checkCollision: function () {
        if (bird.top >= land.top - bird.height) {
            return true;
        }
        for (var i = 0; i < manage.pipe.length; i++) {
            var par = manage.pipe[i];
            if (this.suppleEation(par.up) || this.suppleEation(par.down)) {
                return true;
            }
        }
        return false;
    },
    suppleEation(pipe) {
        var bx = bird.left + bird.width / 2;
        var by = bird.top + bird.height / 2;
        var px = pipe.left + pipe.width / 2;
        var py = pipe.top + pipe.height / 2;

        if (Math.abs(px - bx) <= (bird.width + pipe.width) / 2 &&
            (Math.abs(py - by) <= (bird.height + pipe.height) / 2)) {
            return true;
        } else {
            return false;
        }
    }
}

checkForCollision.timer = setTime(16, checkForCollision, function () {
    if (this.checkCollision()) {
        game.stop();
        game.Over.style.display = "block";
        game.isOver = true;
    }
})
/**
 * 注册键盘按下事件
 */
window.onkeydown = function (e) {
    if (e.key === "Enter") {
        if (game.isOver) {
            location.reload();
            return;
        }
        if (game.isSupend) {
            game.start();
            game.isSupend = false;
        } else {
            game.stop();
            game.isSupend = true;
        }
    } else if (e.key === " ") {
        bird.jup();
    }
}