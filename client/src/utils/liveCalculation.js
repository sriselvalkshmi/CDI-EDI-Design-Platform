export default function liveCalculation(componentList){

    let area = 0;

    let thickness = 0;

    let flow = 0;

    componentList.forEach(c=>{

        if(c.type==="Electrode"){

            area += Number(c.area||0);

            thickness += Number(c.thickness||0);

        }

        if(c.type==="Spacer"){

            flow += Number(c.flowRate||0);

        }

    });

    const removal =
        Math.min(
            99,
            area*0.05 +
            thickness*4
        );

    return{

        totalArea:area,

        totalThickness:thickness,

        flowRate:flow,

        estimatedRemoval:
        removal.toFixed(2)

    };

}