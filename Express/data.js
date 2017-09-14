var mongoose = require('mongoose')

//连接到test数据库，如果这个数据库没有则创建之。
mongoose.Promise = global.Promise
mongoose.connect('mongodb://localhost/test',{useMongoClient:true})

var db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
//once connection open,callback
db.once('open', () => {
    console.log('connection success!!!')
});

var safe = true; //使用安全模式. 表示在写入操作时,如果发生错误,也需要返回信息.
var safe = {
    w: "majority",
    wtimeout: 10000
} //自定义安全模式. w为写入的大小范围. wtimeout设置写入时限. 如果超出10s则返回error
var DogSchema = mongoose.Schema({
    name: {
        type: String,
        enum: ['nihao', 'caonima'], //指定这个属性所能拥有的值的集合。
        match: /caonima/, //指定值必须满足的正则表达式。
        maxlength:1024
    },
    binary: Buffer,
    living: Boolean,
    updated: {
        type: Date,
        default: Date.now
    },
    age: {
        type: Number,
        min: 18,
        max: 65,
        required: true, //必选验证器,指定在保存时，属性是否是必须的。
        index: true //创建索引
    },
    mixed: mongoose.Schema.Types.Mixed, //任意schema类型
    _someId: mongoose.Schema.Types.ObjectId, //代表在数据库中的一个对象实体
    array: [], //数组对象
    ofString: [String], // You can also have an array of each of the other types too.
    ofNumber: [Number],
    ofDates: [Date],
    ofBuffer: [Buffer],
    ofBoolean: [Boolean],
    ofMixed: [mongoose.Schema.Types.Mixed],
    ofObjectId: [mongoose.Schema.Types.ObjectId],
    ofArrays: [
        []
    ],
    ofArrayOfNumbers: [
        [Number]
    ],
    nested: {
        stuff: {
            type: String,
            lowercase: true,
            trim: true
        }
    }
}, {safe:safe})

//改变存储值，db中会保存回调函数返回的值
DogSchema.path('name').get(function (v) {
    return v + ' is my name';
});
 /**
  * method是直接设置在Schema上的.
  * 并不会真正的存放在db中.他只是一个提取数据的方法.
  *
  */
DogSchema.methods.speak = () => {
    var greeting = this.name
        ? "Meow name is" + ths.name
        : "I don't have a name"    
    return greeting
}
//设置虚拟属性，功能和methods一样
DogSchema.virtual('fullName').get(() => {
    var greeting = this.name ?
        "Meow name is" + ths.name :
        "I don't have a name"
    return greeting
})

//用来表示在提取数据的时候, 把documents 内容转化为Object内容输出
DogSchema.set('toObject', {
    getters: true
});
//和toObject一样的使用. 通常用来把 documents 转化为Object. 
//但是, 需要显示使用toJSON()方法,
DogSchema.set('toJSON', {
    getters: true,
    virtuals: false
});

//Model代表了数据库中Document的Collection,
//第一个参数表示上面的Model创建一个名为Dog的集合,但是db中并不是这个名字，
//会先将其全部小写，然后判定是否是不可数的，如果可数，加s, 本例子db的集合名字是cats
var Dog = mongoose.model('Dog',DogSchema)
var Cat = mongoose.model('Cat', { name: String })

//创建document实例
var Kitty = new Cat({
    name: 'Kitty'
})

var Pippy = new Dog
Pippy.name = 'caonima';
Pippy.age = 22;
Pippy.updated = new Date;
Pippy.binary = new Buffer(0);
Pippy.living = false;
Pippy.mixed = {
    any: {
        thing: 'i want'
    }
};
Pippy.markModified('mixed');
Pippy._someId = new mongoose.Types.ObjectId;
Pippy.array.push(1);
Pippy.ofString.push("strings!");
Pippy.ofNumber.unshift(1, 2, 3, 4);
Pippy.ofDates.addToSet(new Date);
Pippy.ofBuffer.pop();
Pippy.ofMixed = [1, [], 'three', {
    four: 5
}];
Pippy.nested.stuff = 'good';

/**
 * 调用虚拟属性
 * 1: 1.192 ms
 * 2: 0.195 ms
 */

console.time(1);
Pippy.speak()
console.timeEnd(1);
console.time(2);
Pippy.fullName
console.timeEnd(2);

/** 
* mongodb中document的创建，2种方法
*/
//使用实例创建
Kitty.save((err) => {
    if (err) {
        console.error(err)
    }
    console.log('success')
})
//使用Model类创建
Cat.create({name: 'Kitty'},(err) => {
    if (err) {
        console.error(err)
    }
    console.log('success')
})

//返回插入值
Pippy.save((err, pippy) => {
    if (err) {
        console.error(err)
    }
    console.log(pippy)
    console.log(pippy.toJSON())
})

/**
 * document的查询
 * 支持MongoDB的丰富的查询语法。
 * 可以使用每个models find， findById， findOne或where 等静态方法进行查找文档。
 * 在mongoose中, query数据 提供了两种方式.
 */

//callback: 'name age nested'代表回调的参数，使用回调函数, 即, query会立即执行,然后返回到回调函数中.
Dog.findOne({'name': 'caonoma'}, 'name age nested',function (err, dogMessage) {
    if (err) return console.error(err);
    console.log(dogMessage)
})

//query: 使用查询方法,返回的是一个Query对象. 该对象是一个Promise, 
//所以可以使用 chain 进行调用.
//最后必须使用exec(cb)传入回调进行处理.cb 是一个套路, 第一个参数永远是err.第二个就是返回的数据。
//results根据查询方式而变， findOne()返回单document文件，find()返回数组，count()返回数目，update()返回受影响的数目
Dog.find({ 'name': 'caonoma' }).select('name age nested').exec(callback(error, results));
Person.
find({
    occupation: /host/
}).
where('name.last').equals('Ghost').
where('age').gt(17).lt(66).
where('likes').in(['vaporizing', 'talking']).
limit(10).
sort('-occupation').
select('name occupation').
exec(callback);

//Query Helpers自定义查询方法
animalSchema.query.byName = function (name) {
    return this.find({
        name: new RegExp(name, 'i')
    });
};

var Animal = mongoose.model('Animal', animalSchema);
Animal.find().byName('fido').exec(function (err, animals) {
    console.log(animals);
});


/**
 * document删除
 * reomve操作仅在通过回调时执行
 * 要强制执行没有回调， 您必须先调用remove()，然后使用exec方法执行它。
 * 既可以在document上执行remove方法也可以在Model上。
 */
Model.find().remove({name: 'Anne Murray'}, callback)
Model.remove({name: 'Anne Murray'}, callback)
//没有添加回调情况
Model.find().remove({name: 'Anne Murray'}).remove(callback)
Model.remove({name: 'Anne Murray'}).exce(callback)

/**
 * document更新
 * 使用Model.update([(conditions, doc, [options], [callback])], 不返回更新对象到应用程序
 * 如果要更新数据库中的单个文档并将其返回到应用程序， 请改用findOneAndUpdate。
 * conditions: 就是query.通过query获取到指定doc
 * doc: 就是用来替换doc内容的值.
 * options: 这块需要说一些下.
 safe(boolean) 是否开启安全模式(default for true)
 upsert(boolean) 如果没有匹配到内容, 是否自动创建(default for false)
 multi(boolean) 如果有多个doc, 匹配到, 是否一起更改(default for false)
 strict(boolean) 使用严格模式(default for false)
 overwrite(boolean) 匹配到指定doc, 是否覆盖(default for false)
 runValidators(boolean): 表示是否用来启用验证.实际上, 你首先需要写一个验证(default for false)
 new（ 使用findOneAndUpdate时才有参数）： bool - 如果为true则返回修改后的文档而不是原始文件。 默认为false。
 */
//$set是,用来指明更新的字段。
 Model.update({age: 18}, {$set: {name: 'jason borne'}}, {multi: true}, function (err, raw) {
     if (err) return handleError(err);
     console.log('raw 就是mongodb返回的更改状态的falg ', raw);
     //比如: { ok: 1, nModified: 2, n: 2 }
 });

 /**
  * Validation
  * 验证器在SchemaType中定义。 是一种中间件
  * Mongoose 触发 validation 同 a pre('save') 钩子一样。
  你能够手动触发 validation 通过doc.validate(callback) or doc.validateSync()。
  */
  cat.save(function (error) {
      //自动执行,validation
  });

  //手动触发 validatio
  //上面已经设置好user的字段内容.
  user.validate(function (error) {
  //error 就是验证不通过返回的错误信息
  assert.equal(error.errors['phone'].message,
      '555.0123 is not a valid phone number!');
  })

//自定义验证器
// 创建验证器
function validator(val) {
    return val == 'something';
}
new Schema({
    name: {
        type: String,
        validate: validator
    }
});

// 附带自定义错误信息

var custom = [validator, 'Uh oh, {PATH} does not equal "something".']
new Schema({
    name: {
        type: String,
        validate: custom
    }
});

//添加多验证器
var many = [{validator: validator,msg: 'uh oh'}, {
    validator: anotherValidator,
    msg: 'failed'
}]
new Schema({name: {type: String,validate: many}});

// 直接通过SchemaType.validate方法定义验证器:
var schema = new Schema({name: 'string'});
schema.path('name').validate(validator, 'validation of `{PATH}` failed with value `{VALUE}`');

