let propertyMap = new WeakMap();

class student {
  constructor(name, age){ 
    var property = {}
    property['name'] = name
    property['age'] = age
    propertyMap.set(this,property)
  }

  getName(){
    console.log(propertyMap.get(this).name)
	  return propertyMap.get(this).name
  }  

  getAge(){
    console.log(propertyMap.get(this).age)
	  return propertyMap.get(this).age
  }
}

var stu = new student('hu', 20)

stu.getName();
stu.getAge();

var stu2 = new student('guan', 18)

stu2.getName();
stu2.getAge();