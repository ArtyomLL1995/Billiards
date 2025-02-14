// Backlog
// 1. Fix speed update for prediciton angles (DONE!)
// 2. Add pockets (and goals functionality) (DONE!)
// 3. Add twisted movement functionality
// 4. Add some textures (DONE!!)
// 5. Add shadows (for cue and balls)
// 6. Add sounds (DONE!)
// 7 Rewrite all setIntervals with requestAnimationFrame (DONE!!)
// 8 Change predictionLine width based on the prediction angle
// 9 Add some rules
// 10 Add display of scored balls
// 11 Small hit wall collision display bug
// 12 Rewrite to typescript

class Game {
    
    static isAnyBallMoving = false
    static predictionAngle
    static hitBallPredictionAngle

    static balls = []
    static pockets = []
   
    static initializeBalls(ballsToInitialize = 15) {
        this.balls.push(new Ball(Canvas.fieldWidth / 2 + 50, Canvas.height / 2, 'brown'))
        for (let i = 0; i < ballsToInitialize; i++) {
            const ballPosition = Utils.ballsPositions[i]
            this.balls.push(new Ball(Canvas.fieldWidth / 2 + ballPosition[0] + 450, Canvas.height / 2 + ballPosition[1], 'white'))
        }
    }

    static initializePockets() {
        const pocketSize = Utils.ballRadius * 1.8
        this.pockets.push({ x: Canvas.leftOffset, y: Canvas.topOffset, size: pocketSize, color: 'black' })
        this.pockets.push({ x: Canvas.leftOffset + Canvas.fieldWidth, y: Canvas.topOffset, size: pocketSize, color: 'black' })
        this.pockets.push({ x: Canvas.leftOffset + Canvas.fieldWidth, y: Canvas.topOffset + Canvas.fieldHeight, size: pocketSize, color: 'black' })
        this.pockets.push({ x: Canvas.leftOffset, y: Canvas.topOffset + Canvas.fieldHeight, size: pocketSize, color: 'black' })
        this.pockets.push({ x: Canvas.leftOffset + (Canvas.fieldWidth / 2), y: Canvas.topOffset + Canvas.fieldHeight + 10, size: pocketSize, color: 'black' })
        this.pockets.push({ x: Canvas.leftOffset + (Canvas.fieldWidth / 2), y: Canvas.topOffset - 10, size: pocketSize, color: 'black' })
    }

    static gameLoop() {
        Canvas.ctx.clearRect(0, 0, Canvas.width, Canvas.height);
        Canvas.drawField()
        this.pockets.forEach(pocket => {
            Utils.draw([],pocket.x,pocket.y,null,null,null,pocket.color,null,true,pocket.size)
        })
        Utils.handleCollisions()
        this.balls.forEach(ball => {
            ball.drawBall()
        })
        this.isAnyBallMoving = this.balls.some(ball => ball.velocity.x != 0 || ball.velocity.y != 0)
        if (!this.isAnyBallMoving) {
            Cue.drawCue()
            Cue.drawTrajectoryLine()
        }
        requestAnimationFrame(() => this.gameLoop())
    }

    static initializeListeners() {
        document.addEventListener('mousemove', this.handleMouseMove.bind(this))
        document.addEventListener('mousedown', this.handleMouseDown.bind(this))
        document.addEventListener('mouseup', this.handleMouseUp.bind(this))
    }

    static handleMouseMove(event) {
        const relativeLeft = event.clientX - Canvas.fieldCoords.left // left relative to the game field
        const relativeTop = event.clientY - Canvas.fieldCoords.top // top relative to the game field
        const left = relativeLeft - this.balls[0].x // left relative to the cue ball
        const top = relativeTop - this.balls[0].y // top relative to the cue ball
        Cue.cueAngle = Math.atan2(top, left)
        const displayData = 
        'Ball left: ' + this.balls[0].x + ' Ball top: ' + this.balls[0].y + '<br>' +
        'Relative left: ' + relativeLeft + ' Relative top: ' + relativeTop + '<br>' +
        'left: ' + left + ' top: ' + top + '<br>' +
        ' angle rad: ' + Cue.cueAngle + '<br>' +
        ' angle deg: ' + Utils.radToDeg(Cue.cueAngle) + '<br>' +
        'Cos: X: ' + Math.cos(Cue.cueAngle) + '<br>' +
        'Sin: Y: ' + Math.sin(Cue.cueAngle) + '<br>'
        Utils.displayData(displayData)
    }

    static handleMouseDownAnimation
    static startAnimationTime
    static currentAccumulatedPower
    static handleMouseDown() {
        if (!this.isAnyBallMoving) {
            if (!this.startAnimationTime) this.startAnimationTime = Date.now()
            if (Date.now() - this.startAnimationTime >= 2) {
                Utils.cueHitPower += 4
                Utils.cueStartPoint += 4
                Utils.cueEndPoint += 4
                this.startAnimationTime = null
            }
            if (Utils.cueHitPower < Utils.maxPullOffset) {
                this.currentAccumulatedPower = (Utils.cueHitPower - Utils.startOffset) * Utils.basePowerMultiplyer
                this.handleMouseDownAnimation = requestAnimationFrame(() => this.handleMouseDown())
            } else {
                cancelAnimationFrame(this.handleMouseDownAnimation)
            }
            
        }
    }

    static handleMouseUpAnimation
    static startAnimationTime2
    static handleMouseUp() {
        cancelAnimationFrame(this.handleMouseDownAnimation)
        if (!this.isAnyBallMoving) {
            if (!this.startAnimationTime2) this.startAnimationTime2 = Date.now()
            if (Date.now() - this.startAnimationTime2 >= 2) {
                Utils.cueStartPoint -= 20
                Utils.cueEndPoint -= 20
                Utils.cueHitPower -= 20
                this.startAnimationTime2 = null
            }
            if (Utils.cueHitPower > 0) {
                this.handleMouseUpAnimation = requestAnimationFrame(() => this.handleMouseUp())
            } else {
                Cue.playKickSound()
                cancelAnimationFrame(this.handleMouseUpAnimation)
                Utils.cueHitPower = Utils.startOffset
                Utils.cueStartPoint = Utils.ballRadius + Utils.cueHitPower
                Utils.cueEndPoint = Utils.cueLength + Utils.cueHitPower
                Game.balls[0].velocity.x = Math.cos(Cue.cueAngle) * this.currentAccumulatedPower
                Game.balls[0].velocity.y = Math.sin(Cue.cueAngle) * this.currentAccumulatedPower
            }
        }
    }
}

class Canvas {
    static canvas = document.getElementById('poolTable')
    static ctx = this.canvas.getContext('2d')
    static fieldCoords
    static width
    static height
    static fieldWidth = 900
    static fieldHeight = 450
    static topOffset
    static leftOffset
    static initializeCanvas(width, height) {
        this.width = width
        this.height = height
        this.topOffset = (this.height - this.fieldHeight) / 2
        this.leftOffset = (this.width - this.fieldWidth) / 2
        this.canvas.width = this.width
        this.canvas.height = this.height
        this.canvas.style.backgroundColor = 'white'
        this.fieldCoords = this.canvas.getBoundingClientRect()
    }
    static drawField() {
        const innerBorderWidth = 18
        this.ctx.fillStyle = "rgba(0,159,1,255)";
        this.ctx.fillRect(this.leftOffset, this.topOffset, this.fieldWidth, this.fieldHeight);
        this.ctx.lineWidth = innerBorderWidth;
        this.ctx.setLineDash([]);
        this.ctx.strokeStyle = 'rgba(1,56,139,255)';
        this.ctx.strokeRect(this.leftOffset - (innerBorderWidth/2), this.topOffset - (innerBorderWidth/2), this.fieldWidth + innerBorderWidth, this.fieldHeight + innerBorderWidth);
    }
}

class Cue {

    static cueAngle = 0
    static startX
    static startY
    static endX
    static endY
    static cueImage = new Image()

    static drawCue() {
        this.cueImage.src = 'images/cue.png'
        Canvas.ctx.save()
        Canvas.ctx.translate(Game.balls[0].x, Game.balls[0].y)
        Canvas.ctx.rotate(Cue.cueAngle)
        Canvas.ctx.drawImage(this.cueImage, -Utils.cueLength-Utils.cueStartPoint, -33, Utils.cueLength, 80)
        Canvas.ctx.restore()
    }

    static drawTrajectoryLine() {
        let endOffset = 1
        const {endX, endY} = calcTrajectoryLine()
        const startX = Game.balls[0].x + ((Utils.startOffset * 2) * Math.cos(Cue.cueAngle))
        const startY = Game.balls[0].y + ((Utils.startOffset * 2) * Math.sin(Cue.cueAngle))
        function calcTrajectoryLine() {
            const endX = Game.balls[0].x + (endOffset * Math.cos(Cue.cueAngle))
            const endY = Game.balls[0].y + (endOffset * Math.sin(Cue.cueAngle))
            let ballTrajectoryCollision = false
            for (let i = 0; i < Game.balls.length; i++) {
                if (Game.balls[i].color != 'brown') {
                    const currentDx = Game.balls[i].x - endX;
                    const currentDy = Game.balls[i].y - endY;
                    const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy);
                    if (currentDistance <= Utils.ballRadius * 2) {
                        ballTrajectoryCollision = true
                        const {ball2Angle, ball1Angle} = Utils.calculateReflectionAngles(currentDx,currentDy)
                        Game.predictionAngle = ball2Angle
                        Game.hitBallPredictionAngle = ball1Angle
                        break
                    }
                }
            }
            const pocketCollision = Utils.pocketCollision(endX,endY)
            if (ballTrajectoryCollision) {
                const lineLength = 100;
                const predictionEndX = endX + lineLength * Math.cos(Game.predictionAngle);
                const predictionEndY = endY + lineLength * Math.sin(Game.predictionAngle);
                const whiteBallPredictionEndX = endX + lineLength / 2 * Math.cos(Game.hitBallPredictionAngle);
                const whiteBallPredictionEndY = endY + lineLength / 2 * Math.sin(Game.hitBallPredictionAngle);
                Utils.draw([], endX, endY, null, null, 'white', null, 1, true, Utils.ballRadius);
                Utils.draw([5, 5], endX, endY, predictionEndX, predictionEndY, 'white', null, 1);
                Utils.draw([5, 5], endX, endY, whiteBallPredictionEndX, whiteBallPredictionEndY, 'white', null, 1);
                return {endX, endY}
            } else if (pocketCollision) {
                Utils.draw([], endX, endY, null, null, 'red', null, 1, true, Utils.ballRadius);
                return {endX, endY}
            } else if (Utils.xHitWallCollision(endX) || Utils.yHitWallCollision(endY)) {
                Utils.draw([], endX, endY, null, null, 'white', null, 1, true, Utils.ballRadius)
                let newAngle
                if (Utils.xHitWallCollision(endX)) {
                    newAngle = Math.PI - Cue.cueAngle
                } else if (Utils.yHitWallCollision(endY)) {
                    newAngle = - Cue.cueAngle
                }
                let newX = endX + 70 * Math.cos(newAngle)
                let newY = endY + 70 * Math.sin(newAngle)
                Utils.draw([5, 5], endX, endY, newX, newY, 'white', null, 1)
                Utils.nullifyPredicitonAngles()
                return {endX, endY}
            } else {
                endOffset++
                return calcTrajectoryLine()
            }
        }
        Utils.draw([5, 5], startX, startY, endX,  endY, 'white', null, 1)
    }
    static kickSound
    static playKickSound() {
        this.kickSound?.stop()
        this.kickSound = new Howl({
            src: ['sounds/Strike.wav'],
            volume: 8
        })
        this.kickSound.play()
    }
}

class Ball {
    ballImage = new Image()
    velocity
    color
    x
    y
    constructor(x, y, color) {
       this.x = x
       this.y = y
       this.color = color
       this.velocity = { x: 0, y: 0 }
    }
    drawBall() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        if (Math.abs(Number(this.velocity.x.toFixed(2))) < 0.01 && Math.abs(Number(this.velocity.y.toFixed(2))) < 0.01) {
            Utils.updateVelocity(this,0)
        } else {
            Utils.updateVelocity(this, Utils.friction)
        }
        Canvas.ctx.save()
        Canvas.ctx.shadowColor = 'grey'; // Shadow color
        Canvas.ctx.shadowBlur = 10; // Blur level
        Canvas.ctx.shadowOffsetX = 0; // Horizontal offset
        Canvas.ctx.shadowOffsetY = 0; // Vertical offset
        this.ballImage.src = this.color == 'white' ? 'images/white_ball.png' : 'images/red_ball.png'
        Canvas.ctx.drawImage(this.ballImage, this.x - Utils.ballRadius, this.y - Utils.ballRadius, Utils.ballDiameter, Utils.ballDiameter)
        Canvas.ctx.restore()
    }
    currentSound
    playSound(sound, volume) {
        if (Math.abs(Number(this.velocity.x.toFixed(2))) > 0.01 && Math.abs(Number(this.velocity.y.toFixed(2))) > 0.01) {
            this.currentSound?.stop()
            this.currentSound = new Howl({
                src: [sound],
                volume
            })
            this.currentSound.play()
        }
    }
}

class Utils {
    static cueLength = 500
    static ballRadius = 15
    static ballDiameter = this.ballRadius * 2
    static startOffset = 20
    static maxPullOffset = 80
    static cueHitPower = this.startOffset
    static cueStartPoint = this.ballRadius + this.cueHitPower
    static cueEndPoint = this.cueLength + this.cueHitPower
    static friction = 0.99
    static basePowerMultiplyer = 1
    static draw(lineDash, startX, startY, endX, endY, strokeStyle, fillStyle, lineWidth, arc, arcSize, arcLength = 2 * Math.PI) {
        Canvas.ctx.save()
        Canvas.ctx.beginPath();
        Canvas.ctx.setLineDash(lineDash); 
        Canvas.ctx.strokeStyle = strokeStyle;
        Canvas.ctx.fillStyle = fillStyle
        Canvas.ctx.lineWidth = lineWidth;
        if (!arc) {
            Canvas.ctx.moveTo(startX, startY)
            Canvas.ctx.lineTo(endX, endY);
        } else {
            Canvas.ctx.arc(startX, startY, arcSize, 0, arcLength)
        }
        if (fillStyle != null) Canvas.ctx.fill()
        if (strokeStyle != null) Canvas.ctx.stroke();
        Canvas.ctx.restore()
    }

    static handleCollisions() {
        for (let i = 0; i < Game.balls.length; i++) {
            const ball1 = Game.balls[i];
            if (Utils.xHitWallCollision(ball1.x)) {
                ball1.playSound('sounds/wall collide.wav', Utils.getSoundLevel(ball1))
                if (ball1.x - Utils.ballRadius < Canvas.leftOffset) {
                    ball1.x = Canvas.leftOffset + Utils.ballRadius
                } else if (ball1.x + Utils.ballRadius > Canvas.fieldWidth + Canvas.leftOffset) {
                    ball1.x = (Canvas.fieldWidth + Canvas.leftOffset) - Utils.ballRadius
                }
                ball1.velocity.x = -ball1.velocity.x;
                Utils.updateVelocity(ball1, 0.8)
            }
            if (Utils.yHitWallCollision(ball1.y)) {
                ball1.playSound('sounds/wall collide.wav', Utils.getSoundLevel(ball1))
                if (ball1.y - Utils.ballRadius < Canvas.topOffset) {
                    ball1.y = Canvas.topOffset + Utils.ballRadius
                } else if (ball1.y + Utils.ballRadius > Canvas.fieldHeight + Canvas.topOffset) {
                    ball1.y = (Canvas.topOffset + Canvas.fieldHeight) - Utils.ballRadius
                }
                ball1.velocity.y = -ball1.velocity.y;
                Utils.updateVelocity(ball1, 0.8)
            }
            // Ball collisions
            for (let j = i + 1; j < Game.balls.length; j++) {
                const ball2 = Game.balls[j];
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < Utils.ballRadius * 2) {
                    ball1.playSound('sounds/ball collide.wav', Utils.getSoundLevel(ball1))
                    if (Game.predictionAngle != null) {
                        // Fixed angle setup for cue hits
                        const hitBallAngleDiff = Math.abs(Utils.getAngleDif(Cue.cueAngle, Game.hitBallPredictionAngle))
                        const hitBallPercentage = Math.max(((hitBallAngleDiff / (Math.PI / 2)) * 100), 5) ;
                        const currentVelocity = Math.abs(ball1.velocity.x) + Math.abs(ball1.velocity.y)
                        const ball2VelocityPart = (currentVelocity / 100) * hitBallPercentage
                        const ball1VelocityPart = currentVelocity - ball2VelocityPart
                        ball1.velocity.x = Math.cos(Game.hitBallPredictionAngle) * ball1VelocityPart
                        ball1.velocity.y = Math.sin(Game.hitBallPredictionAngle) * ball1VelocityPart
                        ball2.velocity.x = Math.cos(Game.predictionAngle) * ball2VelocityPart
                        ball2.velocity.y = Math.sin(Game.predictionAngle) * ball2VelocityPart
                    } else {
                        // Dynamic angle setup for collision hits
                        const collisionAngle = Math.atan2(dy, dx) 
                        const nx = Math.cos(collisionAngle)
                        const ny = Math.sin(collisionAngle)
                        const dvx = ball2.velocity.x - ball1.velocity.x;
                        const dvy = ball2.velocity.y - ball1.velocity.y;
                        const relativeVelocity = nx * dvx + ny * dvy;
                        if (relativeVelocity > 0) continue;
                        ball1.velocity.x += relativeVelocity * nx;
                        ball1.velocity.y += relativeVelocity * ny;
                        ball2.velocity.x -= relativeVelocity * nx;
                        ball2.velocity.y -= relativeVelocity * ny;
                        const overlap = (Utils.ballRadius * 2 - distance) / 2;
                        ball1.x -= overlap * nx;
                        ball1.y -= overlap * ny;
                        ball2.x += overlap * nx;
                        ball2.y += overlap * ny;
                    }
                    Utils.nullifyPredicitonAngles()
                }
            }
            if (Utils.pocketCollision(ball1.x, ball1.y)) {
                ball1.playSound('sounds/Hole.wav', 1)
                Game.balls.splice(i, 1)
            }
        }
    }
    static displayData(data) {
        const dataDiv = document.getElementById('data')
        dataDiv.innerHTML = data
    }
    static calculateReflectionAngles(dx, dy) {
        const ball2Angle = Math.atan2(dy, dx);
        let ball1Angle;
        let angleDiff = this.getAngleDif(Cue.cueAngle, ball2Angle);
        const rightAngleOffset = Math.PI / 60; // ~3 degrees in radians
        if (Math.abs(angleDiff) <= rightAngleOffset) {
            ball1Angle = ball2Angle;
        } else if (angleDiff > 0) {
            ball1Angle = ball2Angle + Math.PI/2; // Subtract 90 degrees in radians
        } else {
            ball1Angle = ball2Angle - Math.PI/2; // Add 90 degrees in radians
        }
        return { ball2Angle, ball1Angle };
    }
    static getAngleDif(baseAngle, targetAngle) {
        let angleDiff = baseAngle - targetAngle;
        while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
        while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
        return angleDiff
    }
    static radToDeg(rad) {
        let deg = (rad * 180) / Math.PI;
        deg = deg % 360;
        if (deg < 0) {
            deg += 360;
        }
        return Number(deg.toFixed(2));
    }
    static nullifyPredicitonAngles() {
        Game.predictionAngle = null
        Game.hitBallPredictionAngle = null
    }
    static updateVelocity(ball, coefficient) {
        ball.velocity.x *= coefficient;
        ball.velocity.y *= coefficient;
    }
    static ballsPositions = [
        // First row (1 ball)
        [0, 0, 1],
        // Second row (2 balls)
        [this.ballDiameter * Math.cos(Math.PI/6), -this.ballDiameter * Math.sin(Math.PI/6), 2],
        [this.ballDiameter * Math.cos(Math.PI/6), this.ballDiameter * Math.sin(Math.PI/6), 3],
        // Third row (3 balls)
        [2 * this.ballDiameter * Math.cos(Math.PI/6), -2 * this.ballDiameter * Math.sin(Math.PI/6), 4],
        [2 * this.ballDiameter * Math.cos(Math.PI/6), 0, 5],
        [2 * this.ballDiameter * Math.cos(Math.PI/6), 2 * this.ballDiameter * Math.sin(Math.PI/6), 6],
        // Fourth row (4 balls)
        [3 * this.ballDiameter * Math.cos(Math.PI/6), -3 * this.ballDiameter * Math.sin(Math.PI/6), 7],
        [3 * this.ballDiameter * Math.cos(Math.PI/6), -this.ballDiameter * Math.sin(Math.PI/6), 8],
        [3 * this.ballDiameter * Math.cos(Math.PI/6), this.ballDiameter * Math.sin(Math.PI/6), 9],
        [3 * this.ballDiameter * Math.cos(Math.PI/6), 3 * this.ballDiameter * Math.sin(Math.PI/6), 10],
        // Fifth row (5 balls)
        [4 * this.ballDiameter * Math.cos(Math.PI/6), -4 * this.ballDiameter * Math.sin(Math.PI/6), 11],
        [4 * this.ballDiameter * Math.cos(Math.PI/6), -2 * this.ballDiameter * Math.sin(Math.PI/6), 12],
        [4 * this.ballDiameter * Math.cos(Math.PI/6), 0, 13],
        [4 * this.ballDiameter * Math.cos(Math.PI/6), 2 * this.ballDiameter * Math.sin(Math.PI/6), 14],
        [4 * this.ballDiameter * Math.cos(Math.PI/6), 4 * this.ballDiameter * Math.sin(Math.PI/6), 15],
    ]
    static yHitWallCollision(y) {
       return y - Utils.ballRadius <= Canvas.topOffset || y + Utils.ballRadius >= Canvas.fieldHeight + Canvas.topOffset
    }
    static xHitWallCollision(x) {
        return x - Utils.ballRadius <= Canvas.leftOffset || x + Utils.ballRadius >= Canvas.fieldWidth + Canvas.leftOffset
    }
    static pocketCollision(x,y) {
        for (let k = 0; k < Game.pockets.length; k++) {
            const pocket = Game.pockets[k]
            const dx = pocket.x - x
            const dy = pocket.y - y
            const distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < Utils.ballRadius + pocket.size / 2) {
                return true
            }
        }
    }
    static getSoundLevel(ball) {
        const maxPossibleSpeed = Math.abs(Math.cos(Cue.cueAngle) * this.maxPullOffset) + Math.abs(Math.sin(Cue.cueAngle) * this.maxPullOffset)
        return Math.max(0.1, Number((((Math.abs(ball.velocity.x) + Math.abs(ball.velocity.y)) / maxPossibleSpeed)).toFixed(1)))
    }
}

document.addEventListener('DOMContentLoaded', () => {
    Canvas.initializeCanvas(window.innerWidth, window.innerHeight)
    Game.initializePockets()
    Game.initializeBalls(15)
    Game.initializeListeners()
    Game.gameLoop()
});




