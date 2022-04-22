const get_bounds = (keys, data) => {
    const bounds = {};
    bounds.min = {};
    bounds.max = {};
    keys.forEach(k => {bounds.min[k] = Infinity; bounds.max[k] = -Infinity})
    data.forEach(pt => {
        keys.forEach(k => {
            if(pt[k] < bounds.min[k]) bounds.min[k] = pt[k];
            if(pt[k] > bounds.max[k]) bounds.max[k] = pt[k];
        })
    })
    return bounds;
    
}

const to_viewbox = (xmin, ymin, xmax, ymax) =>  [xmin, ymin, xmax, ymax].join(" ")

const draw_demo_points = (svg_selection, data, selected, x, y) => {
    svg_selection.selectAll("circle")
        .data(data)
        .join("circle")
        .attr("transform", d => `translate(${x(d.AE1)},${y(d.AE2)})`)
        .attr("r", 3)
        .attr("fill", d => selected[d.id] ? "red" : "gray")
        .attr("subjid", d => d.id);
}

const calc_averages = (data, keys, fitler) => {
    const out = {};
    let n = 0;
    keys.forEach(k => out[k] = 0);
    data.forEach(d => {
        if(filter(d)){
            keys.forEach(k => {
                out[k] += d[k];
            });
            n = n + 1;                       
        }
    });
    keys.forEach(k => out[k] = out[k]/n);
    return out;
}

const reduce_keys = (data, keys, f, init, filter) => {
    let state = init;
    let fs = {};
    let n = 0;
    if(typeof f === "function"){
        keys.forEach(key => fs[key] = f);        
    } else {
        fs = f;
    }
    data.forEach(d => {
        if(filter(d)){
            n++;
            keys.forEach(key => {
                state[key] = fs[key](state[key], d[key]);
            });
        }
    });
    return [n,state];    
}

const label_ethnitities = (a) => a.map(a => a === 1 ? "Nat.Am./Al" :
                                       a === 2 ? "Asn/Pac.Isl." :
                                       a === 3 ? "Blk" :
                                       a === 4 ? "Wht" :
                                       a === 5 ? "Other" : "Other");

const label_nonwhite = (a) => a.map(e => e === 4 ? "White" : "Nonwhite")

const label_hispanic = (a) => a.map(h => h === 1 ? "Hsp" : "NonHsp");
const label_married = (a) => a.map(m => m === 1 ? "Mrd" : "NonMrd");
const label_gender = (a) => a.map(g => g === 1 ? "Male" :
                                  g === 2 ? "Female" :
                                  g === 3 ? "Other" : "Other");

const norm = (a) => {
    let the_min = Infinity;
    let the_max = -Infinity;
    a.forEach(e => {
        the_min = e < the_min ? e : the_min;
        the_max = e > the_max ? e : the_max;
    });
    const range = the_max - the_min;
    return a.map(e => (e - the_min)/range);
}

const inside_out = (data) => {
    const keys = Object.keys(data[0]);
    const out = {};
    keys.forEach(k => out[k] = []);
    data.forEach(d => keys.forEach( k => out[k].push(d[k])))
    return out;
}

const outside_in = (data) => {
    const keys = Object.keys(data);
    const out = [];
    const n = data[keys[0]].length;
    for(let i = 0; i < n; i++){
        let element = {};
        keys.forEach(k => element[k] = data[k][i]);
        out.push(element);
    }
    return out;
}

const tidy_demo_data = (data) => {
    const iodata = inside_out(data);
    const out = [];
    out.id = iodata.id;
    out.education = norm(iodata.education);
    out.ethnicity = label_ethnitities(iodata.ethnicity);
    out.hispanic = label_hispanic(iodata.hispanic);
    out.employment_status = norm(iodata.employment_status);
    out.exercise = norm(iodata.exercise);
    out.handedness = norm(iodata.handedness);
    out.sses = norm(iodata.sses);
    out.married_or_living_as_marri = label_married(iodata.married_or_living_as_marri);
    out.age = norm(iodata.age);
    out.weight = norm(iodata.weight);
    out.gender = label_gender(iodata.gender);
    out.backpain_length = norm(iodata.backpain_length);
    out.nonwhite = label_nonwhite(iodata.ethnicity);
    return outside_in(out);
}

const demographic_variables = ['gender','married_or_living_as_marri','sses','non_white']

const to_color = n => {
    const x = Math.round((1-n)*255);
    return "rgb("+[x,x,x].join(",")+")"
}

const draw_demographic_average = (svg_selection, demo_data, filter) => {
    const gender_count = {male:0,female:0};
    const married_count = {married:0,unmarried:0}
    let sses_average = 0;
    const nonwhite = {nonwhite:0, white:0};
    let n = 0;
    demo_data.forEach(d => {
        if(filter(d)){            
            if(d.gender==="Male") gender_count["male"]++;
            if(d.gender==="Female") gender_count["female"]++;
            sses_average += d.sses;
            if(d.nonwhite==="Nonwhite") nonwhite["nonwhite"]++;
            if(d.nonwhite==="White") nonwhite["white"]++;
            if(d.married_or_living_as_marri==="Mrd") married_count["married"]++;
            if(d.married_or_living_as_marri==="NonMrd") married_count["unmarried"]++;
            n++;
        }
    });
    gender_count.male = gender_count.male / n;
    gender_count.female = gender_count.female / n;
    married_count.married = married_count.married / n;
    married_count.unmarried = married_count.unmarried / n;
    sses_average = sses_average/n;
    nonwhite.nonwhite = nonwhite.nonwhite / n;
    nonwhite.white = nonwhite.white / n;

    svg_selection.select("#gender_male").attr("fill",to_color(gender_count.male))
    svg_selection.select("#gender_female").attr("fill",to_color(gender_count.female))

    svg_selection.select("#married_yes").attr("fill",to_color(married_count.married))
    svg_selection.select("#married_no").attr("fill",to_color(married_count.unmarried))

    svg_selection.select("#nonwhite").attr("fill",to_color(nonwhite.nonwhite))
    svg_selection.select("#white").attr("fill",to_color(nonwhite.white))

    svg_selection.select("#sses").attr("width",sses_average*360);

}

const to_average = x => x.reduce((a,b) => a+b)/x.length

const average_outcomes_by_group = (data, variable, filter) => {
    const groups = {};
    const sorter = (a,b) => {
        const at = a.time;
        const bt = b.time;
        const ag = a.group;
        const bg = b.group;
        return ag < bg ? -1 : ag > bg ? 1 : at < bt ? -1 : at > bt ? 1 : 0;
    }
    data.forEach(d => {
        if(filter(d)){
            const group = d.group;
            const time = d.time;
            const key = `${group}:${time}`
            const container = groups[key] || {};
            groups[key] = container;
            container.time = time;
            container.group = group;
            const holder = container[variable] || [];
            container[variable] = holder;
            holder.push(d[variable]);
        }
    });
    return Object.keys(groups).map(item => {
        groups[item][variable] = to_average(groups[item][variable]);
        return groups[item];
    }).sort(sorter);
}

const split = (data, mapper) => {
    const out = {};
    data.forEach(d => {
        const key = mapper(d);
        const holder = out[key] || [];
        out[key] = holder;
        holder.push(d);
    })
    return out;
}

const group_to_color = (group) => ({"G1":"RED","G2":"GREEN","G3":"BLUE"})[group];

const draw_outcomes = (svg_selection, outcome_data, selected, x, y) => {
    console.log(outcome_data)
    const adata = average_outcomes_by_group(outcome_data, 'bpi_intensity', d => selected[d.id])
    const by_group = split(adata, d => "G"+d.group);
    Object.keys(by_group).forEach(group => {
        const line = d3.line()
              .x(d => x(d.time))
              .y(d => y(d.bpi_intensity));
        console.log(line(by_group[group]))
        svg_selection
            .select("#"+group)        
            .attr("d",line(by_group[group]))
            .attr("style", `fill:none;stroke:${group_to_color(group)};stroke-width:1`);
    })
}

const get_brushed = (data,x0,y0,x1,y1) => {
    console.log(x0, y0, x1, y1)
    const out = {};
    let i = 0;
    data.forEach(pt => {
        const x = pt.AE1;
        const y = pt.AE2;
        if(x > x0 && x < x1 && y > y1 && y < y0){
            out[pt.id] = true;
            i++;
        } else {
            out[pt.id] = false;
        }
    });
    console.log(`count: ${i}`)
    return out;
}

const main = (data) => {
    let selected_ids = {};
    const demo_ae = data[0];
    const demo_raw = data[1];
    const outcomes = data[2];
    const demo_tidy = tidy_demo_data(demo_raw);

    const ae_bounds = get_bounds(['AE1','AE2'], demo_ae);

    const proj_w = 400;
    const proj_h = 400;
    const out_w = 400;
    const out_h = 200;
    const demo_w = 400;
    const demo_h = 200;

    demo_ae.forEach(d => selected_ids[d] = true);

    const proj_margin = margin = ({top: 20, right: 30, bottom: 30, left: 40});

    const px = d3.scaleLinear()
          .domain(d3.extent(demo_ae, d => d.AE1)).nice()
          .range([proj_margin.left, proj_w - proj_margin.right])

    const py = d3.scaleLinear()
          .domain(d3.extent(demo_ae, d => d.AE2)).nice()
          .range([proj_h-proj_margin.bottom, proj_margin.top])

    const out_margin = margin = ({top: 20, right: 30, bottom: 30, left: 40});
    
    const ox = d3.scaleLinear()
          .domain(d3.extent(outcomes, d => d.time)).nice()
          .range([out_margin.left, out_w - out_margin.right])

    const oy = d3.scaleLinear()
          .domain(d3.extent(outcomes, d => d.bpi_intensity)).nice()
          .range([out_h-out_margin.bottom, out_margin.top])


    const pXAxis = g => g
    .attr("transform", `translate(0,${proj_h - proj_margin.bottom})`)
    .call(d3.axisBottom(px))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", proj_w - proj_margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text("AE1"))

    const pYAxis = g => g
        .attr("transform", `translate(${proj_margin.left},0)`)
        .call(d3.axisLeft(py))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
              .attr("x", 4)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text("AE2"))

    const oXAxis = g => g
    .attr("transform", `translate(0,${out_h - out_margin.bottom})`)
    .call(d3.axisBottom(ox))
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
        .attr("x", out_w - out_margin.right)
        .attr("y", -4)
        .attr("fill", "#000")
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text("Time (months)"))

    const oYAxis = g => g
        .attr("transform", `translate(${proj_margin.left},0)`)
        .call(d3.axisLeft(oy))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
              .attr("x", 4)
              .attr("text-anchor", "start")
              .attr("font-weight", "bold")
              .text("bpi_intensity"))

    

    let brush_count = 0;
    const brush = d3.brush().on("start brush end", brushed)
    
    d3.select("body").append("h1").text("PRT on cLBP Demographics Explorer");
    d3.select("body").append("svg")
        .attr("id","projection")
        .attr("width",proj_w)
        .attr("height", proj_h)
        .attr("viewBox", to_viewbox(0,0,proj_w,proj_h));

    const projection_svg = d3.select("#projection");
    projection_svg.append("g").call(pXAxis);
    projection_svg.append("g").call(pYAxis);

    projection_svg.append("g").attr("id","G1");
    projection_svg.append("g").attr("id","G2");
    projection_svg.append("g").attr("id","G3");
    
    projection_svg.call(brush);

    d3.select("body").append("svg")
        .attr("id","demographics")
        .attr("width",400)
        .attr("height",200)
        .attr("viewBox",to_viewbox(0,0,400,200));
    const demo_svg = d3.select("#demographics");

    const rect_data = [
        {id:"gender_male",row:0,col:0},
        {id:"gender_female",row:0,col:1},
        {id:"married_yes",row:1, col:0},
        {id:"married_no",row:1, col:1},
        {id:"nonwhite",row:2,col:0},
        {id:"white",row:2,col:1},
        {id:"sses",row:3,col:0,width:0}
    ]
    
    demo_svg.selectAll("rect")
        .data(rect_data)
        .join("rect")
        .attr("id", d => d.id)
        .attr("x",  d => 20 + d.col*80)
        .attr("y",  d => 20 + d.row*(35+12))
        .attr("height", d => 35)
        .attr("width", d => d.width || 80)
        .attr("stroke","black")
        .attr("fill","white")

    const label_data = [
        {text:"Male",row:0,col:0},
        {text:"Female",row:0,col:1},

        {text:"Married",row:1,col:0},
        {text:"Unmarried",row:1,col:1},
        
        {text:"Nonwhite",row:2,col:0},
        {text:"White",row:2,col:1},

        {text:"Socioeconomic Status",row:3,col:0}
    ];

    demo_svg.selectAll("text")
        .data(label_data)
        .join("text")
        .text(d => d.text)
        .attr("x",  d => 20 + d.col*80)
        .attr("y",  d => 17 + d.row*(35+12))
        .attr("stroke","black")
        .attr("fill","black")
        .attr("style","font: italic 10px sans-serif")

    

    d3.select("body").append("svg")
        .attr("id","outcomes")
        .attr("width",out_w)
        .attr("height",out_h);
    const outcomes_svg = d3.select("#outcomes");
    outcomes_svg.append("g").call(oXAxis);
    outcomes_svg.append("g").call(oYAxis);
    outcomes_svg.append("path").attr("id","G1");
    outcomes_svg.append("path").attr("id","G2");
    outcomes_svg.append("path").attr("id","G3");

    

    draw_demo_points(d3.select("#projection"), demo_ae, selected_ids, px, py);
    draw_outcomes(outcomes_svg, outcomes, selected_ids, ox, oy);
    draw_demographic_average(demo_svg, demo_tidy, d => selected_ids[d.id]);

    function brushed({selection}){
        if(selection){
            const [[rx0,ry0],[rx1,ry1]] = selection;
            const x0 = px.invert(rx0);
            const y0 = py.invert(ry0);
            const x1 = px.invert(rx1);
            const y1 = py.invert(ry1);
            console.log(rx0, ry0, rx1, ry1)
            selected_ids = get_brushed(demo_ae, x0, y0, x1, y1);
            draw_demo_points(projection_svg, demo_ae, selected_ids, px, py);
            draw_outcomes(outcomes_svg, outcomes, selected_ids, ox, oy);
            draw_demographic_average(demo_svg, demo_tidy, d => selected_ids[d.id]);
        }
    }
}

const numerify = row => {
    Object.keys(row).forEach(k => {
        const nif = +row[k];
        if(!isNaN(nif)){
            row[k] = nif;
        }
    });
    return row;
}
const demo_ae_p = d3.csv("derived_data/demographic_ae.csv", numerify);
const demo_raw_p = d3.csv("source_data/demographics.csv", numerify);
const outcomes_p = d3.csv("derived_data/clinical_outcomes-d3.csv", numerify);

const data = Promise.all([demo_ae_p, demo_raw_p, outcomes_p]);

document.addEventListener("DOMContentLoaded", () => {
    data.then(main);
});

