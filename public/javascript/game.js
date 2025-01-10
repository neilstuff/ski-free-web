import { createView } from './game_view.js';
import { createHazard } from './hazard.js';
import { createSasquatch } from './sasquatch.js';
import { createSkier } from './skier.js';
import { Util } from './util.js';

const EasyWinScore = 1000


export const createGame = (skierGraphics, obstacleGraphics) => {

    return new Game(skierGraphics, obstacleGraphics);

}

var Game = function(skierGraphics, obstacleGraphics) {
    this.skierGraphics = skierGraphics;
    this.obstacleGraphics = obstacleGraphics;
    this.reset();
    this.winningScore = EasyWinScore;

};

Game.prototype.reset = function() {
    this.skier = createSkier(this.skierGraphics);
    this.sasquatch = createSasquatch(this.skierGraphics)
    this.keysPressed = { left: false, right: false, up: false };
    this.hazards_num = 9;
    this.hazards = [];
    this.SkierCaught = false;
    this.populateHazards()
    this.level = 'easy';
    this.jumping = false;
    this.pauseGame = false;
    this.score = 0;
    this.fallCount = 0;
    this.userWins = false;
}

Game.prototype.populateHazards = function() {
    for (var i = 0; i < this.hazards_num && !this.SkierCaught; i++) {
        this.hazards.push(createHazard(Util.randomPosition(), this.obstacleGraphics))
    }
}

Game.prototype.createHazard = function() {
    if (this.hazards.length < this.hazards_num) {

        let Hazardposition = Util.randomStartPosition()
        while (this.avoidOverlapPosition(Hazardposition)) {
            Hazardposition = Util.randomStartPosition()
        }

        let newHazard = createHazard(Util.randomStartPosition(), this.obstacleGraphics)

        if (this.level === 'medium') {
            newHazard.moveSpeed = 7
        }

        if (this.level === 'hard') {
            newHazard.moveSpeed = 8
        }

        this.hazards.push(newHazard)
    }
}

Game.prototype.avoidOverlapPosition = function(position) {
    let latestHazards = this.hazards.slice((this.hazards.length / 2), -1)
    let posX = position[0];
    let posY = position[1];
    let result = true

    latestHazards.forEach(hazard => {
        let hazX = hazard.position[0];
        let hazY = hazard.position[1];
        if (posX < hazX + 20 && posX > hazX - 20) {
            result = false
        }
    });

    return !result
}

Game.prototype.moveHazards = function() {

    if (!this.SkierCaught) {
        this.hazards.forEach(hazard => {
            hazard.move()
        })
    }
}

Game.prototype.deleteHazards = function() {
    for (var i = 0; i < this.hazards.length; i++) {
        if (this.hazards[i].position[1] < -60) {
            delete this.hazards[i];
        }
    }
    let updatedHazards = [];
    for (var i = 0; i < this.hazards.length; i++) {
        if (this.hazards[i] !== undefined) {
            updatedHazards.push(this.hazards[i])
        }
    }

    this.hazards = updatedHazards
}

Game.prototype.moniterDifficulty = function() {
    if (this.score > 1000) {
        this.hazards_num = 30
    } else if (this.score > 750) {
        this.hazards_num = 25;
        this.level = 'hard';
        this.updateSpeed();
    } else if (this.score > 600) {
        this.hazards_num = 25
    } else if (this.score > 500) {
        this.hazards_num = 20
    } else if (this.score === 110) {
        this.hazards_num = 17;
        this.level = 'medium';
        this.updateSpeed();
    } else if (this.score > 100) {
        this.hazards_num = 14
    } else {
        this.hazards_num = 10
    }
}

Game.prototype.updateSpeed = function() {

    this.hazards = this.hazards.map(hazard => {
        if (this.level === 'medium') {
            hazard.moveSpeed = 7;
        } else if (this.level === 'hard') {
            hazard.moveSpeed = 8;
        }
        return hazard;

    })
}

Game.prototype.moniterHazards = function() {
    this.moveHazards();
    this.deleteHazards();
    this.moniterDifficulty();
    this.createHazard();
}

Game.prototype.checkForCollisions = function() {
    let skiX = this.skier.position[0];
    let skiY = this.skier.position[1];

    this.hazards.forEach(hazard => {
        let hazX = hazard.position[0];
        let hazY = hazard.position[1];
        if (hazard.collided == false) {
            if ((skiX < (hazX + hazard.radius)) &&
                (skiX > (hazX - hazard.radius)) &&
                (skiY < (hazY + 4)) &&
                (skiY > (hazY - 8))
            ) {
                if (hazard.variant !== 5) {
                    this.skier.state = "crashed"
                    hazard.collided = true
                    this.score -= 100;
                    this.fallCount += 1
                    this.onCollision()
                } else if (hazard.variant === 5) {
                    this.jumping = true;
                    this.initiateJumpSequence()
                }
            }
        }
    })
}

Game.prototype.initiateJumpSequence = function() {
    this.skier.jumping = true;
}

Game.prototype.onCollision = function() {
    this.pauseGame = true
    setTimeout(() => {
        this.pauseGame = false;
    }, 1000);

}

Game.prototype.moniterSasquatch = function() {
    let skiX = this.skier.position[0];
    let skiY = this.skier.position[1];
    let sasqX = this.sasquatch.position[0];
    let sasqY = this.sasquatch.position[1];
    if ((skiX < (sasqX + this.sasquatch.radius)) &&
        (skiX > (sasqX - this.sasquatch.radius)) &&
        (skiY < (sasqY + 20)) &&
        (skiY > (sasqY - 20))
    ) {
        this.SkierCaught = true;;
    }
}

Game.prototype.checkJumpStatus = function() {
    this.jumping = this.skier.jumping
}

Game.prototype.updateBoard = function() {
    this.checkJumpStatus()
    if (!this.jumping) {
        this.moniterSasquatch();
    }
    if (!this.pauseGame) {
        if (!this.jumping) {
            this.checkForCollisions();
        }
        if (!this.SkierCaught) {
            this.moniterHazards();
        }
    }
}

Game.prototype.draw = function(context) {
    if (!this.pauseGame) {
        this.skier.state = "alive"
    }

    context.clearRect(0, 0, 500, 500);

    this.hazards.forEach(hazard => {
        hazard.draw(context);
    })

    if (!this.SkierCaught) {
        this.score += 1
        this.skier.draw(context, this.keysPressed, this.pauseGame, this.level);
        this.sasquatch.draw(context, this.skier.position)
    } else {
        if (this.score >= this.winningScore) {
            this.sasquatch.drawDeath(context)
            this.userWins = true
        } else {
            this.sasquatch.drawSasquatchFeeds(context)
        }
    }

    this.drawNumbers(context);

    this.winLossMessage(context)

}

/**
 * Draw Numbers - Score/Crashes
 * 
 * @param {*} context The canvas context
 */
Game.prototype.drawNumbers = function(context) {
    let score = "Timer: " + this.score;
    let crash = "Crashes: " + this.fallCount;

    if (this.score > 1000) {
        context.fillStyle = "#000000";
    } else {
        context.fillStyle = "#000000"
    }

    context.font = "14px 'W95FA'";
    context.fontWeight = "bold"
    context.fillText(score, 10, 20);
    context.fillText(crash, 80, 20);

}


Game.prototype.winLossMessage = function(context) {
    var canvas = document.getElementById('myCanvas');

    if (this.SkierCaught) {

        window.setTimeout((game, context) => {
            this.SkierCaught = false;
            game.view.stopGame();

            context.clearRect(0, 0, 500, 500);
            context.drawImage(
                document.getElementById('yeti-dance'),
                220, 130
            );

            context.font = "18px 'W95FA'";
            context.fontWeight = "bold"
            context.fillText("Restarting...", 220, 250);

            game.reset();

            window.setTimeout((game, context) => {
                game.view.startGame();
            }, 200, game, context);

        }, 3000, this, context);

    }

};