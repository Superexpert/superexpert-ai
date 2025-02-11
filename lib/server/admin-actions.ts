'use server';
import 'reflect-metadata';



export async function getServerTools() {
    console.log('getServerTools  is awesome');
    console.dir(registry, {depth: null});
}

const registry:any = [];



const ServerTool = (name:string, description:String) => {
  return (target: Object, propertyKey:any, descriptor?: PropertyDescriptor) => {
    //registry.push({functionName:propertyKey, "description": description});
    registry.push({
      functionName:name, 
      "description": description,
      "actual functionName": propertyKey
    });
  }
};


const ServerToolParameter = (name:string, description:String) => {
  return (target: Object, propertyKey:string|symbol, parameterIndex:number) => {

    const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    const paramType = parameterTypes[parameterIndex];

    registry.push({
      parameterName:name, 
      "description": description,
      "index": parameterIndex,
      "actual functionName": propertyKey,
      "more": paramType.name
    });
  }
}

// function logParameter(
//   target: Object,
//   propertyKey: string | symbol,
//   parameterIndex: number
// ) {
//   console.log(`Parameter at index ${parameterIndex} in method ${String(propertyKey)} has been decorated.`);
// }


class ServerTools {
  
  @ServerTool('getWeather', 'This is a tool to get the weather')
  public async gw(
    @ServerToolParameter('location', 'This is the location')
    location:string,
    @ServerToolParameter('favNumber', 'This is your favorite number')
    favNumber:number,
    @ServerToolParameter('favColor', 'Your favorite color')
    favColor: 'red'|'blue'|'green',
  )
  {
    console.log('getWeather is awesome');
  }
}



// const decoratorA = (value: boolean) => {
//   return (target: any, propertyKey:any, descriptor?: PropertyDescriptor) => {
//     console.log('decoratorB is awesome');
//     registry.push(descriptor);

//     const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
//     const types = parameterTypes.map((type: any) => type.name);
//     console.log(`Method ${propertyKey} parameter types: ${types.join(', ')}`);
//   }
// }

// function LogParameterTypes(
//   target: any,
//   propertyKey: string,
//   descriptor: PropertyDescriptor
// ) {
//   const parameterTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
//   const types = parameterTypes.map((type: any) => type.name);
//   registry.push(types);
//   //console.log(`Method ${propertyKey} parameter types: ${types.join(', ')}`);
// }


// class Person {

//     @LogParameterTypes
//     public getFood(location:string, favNumber:number) {
//         console.log('getFood is awesome');
//     }

// }
