IN vec2 texCoord;
UNI sampler2D tex;
UNI sampler2D texPos;
UNI sampler2D texAbsVel;
UNI sampler2D texCollision;
UNI sampler2D texLifeProgress;

UNI float strength;
UNI float falloff;
UNI float size;
UNI vec3 areaPos;
UNI vec3 scale;
UNI vec3 direction;
UNI vec4 collisionParams;
UNI float timeDiff;
UNI float collisionFade;

UNI vec3 ageMul; // x age start - y age end - z age fade
UNI sampler2D texTiming;

{{CGL.RANDOM_LOW}}


#ifdef HAS_TEX_MUL
    UNI sampler2D texMul;
#endif

float MOD_sdSphere( vec3 p, float s )
{
    return length(p)-s;
}

float MOD_map(float value,float min1,float max1,float min2,float max2)
{
    return max(min2,min(max2,min2 + (value - min1) * (max2 - min2) / (max1 - min1)));
}

float MOD_sdRoundBox( vec3 p, vec3 b, float r )
{
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

void main()
{
    vec4 pos=texture(texPos,texCoord);
    vec4 col=texture(tex,texCoord);
        col.a=1.0;


    vec4 collisionCol=texture(texCollision,texCoord);

    vec4 timing=texture(texTiming,texCoord);
    float age=timing.g-timing.r;


    float lifeProgress=texture(texLifeProgress,texCoord).r;
        // collisionCol.r*=step(1.0-lifeProgress,0.1);



    collisionCol.r*=(1.0-(timeDiff*collisionFade));
    collisionCol.a=1.0;
    collisionCol.g=collisionCol.b=0.0;

    if(age<0.1)collisionCol.r=0.0;
        // collisionCol.r*=1.0-step(0.3,age);

    vec3 p=pos.xyz-areaPos;

    #ifdef MOD_AREA_SPHERE
        float MOD_de=1.0-MOD_sdSphere(p,size-falloff);
    #endif

    #ifdef MOD_AREA_BOX
        float MOD_de=1.0-MOD_sdRoundBox(p,scale-falloff,0.0);
    #endif
    #ifdef MOD_AREA_EVERYWHERE
        float MOD_de=1.0;
    #endif

    #ifdef HAS_TEX_TIMING

        MOD_de*=smoothstep(0.0,1.0, MOD_map(age,ageMul.x,ageMul.x+ageMul.z,0.0,1.0));

    #endif

    MOD_de=MOD_map(
        MOD_de,
        0.0, falloff,
        0.0,1.0
        );

    #ifdef INVERT_SHAPE
        MOD_de=1.0-MOD_de;
    #endif

    vec3 finalStrength=vec3(strength);

    #ifdef HAS_TEX_MUL
        finalStrength*=texture(texMul,texCoord).rgb;
    #endif


    #ifdef METHOD_DIR
        if(length(direction)>0.0)
            col.xyz+=normalize(direction)*finalStrength*MOD_de;
    #endif

    #ifdef METHOD_POINT

        // col.xyz+=normalize( pos.xyz-areaPos )*finalStrength*MOD_de;

        if(MOD_de>0.0)
            col.xyz+=normalize( pos.xyz-areaPos )*finalStrength*MOD_de;
    #endif



    #ifdef METHOD_COLLISION

        if(MOD_de>0.0)
        {
            // collisionParams
            // x: bouncyness
            // y: dir randomness
            // z: forceoutwards
            // w: tbd

            collisionCol.ra=vec2(1.0);

            float bouncyness=collisionParams.x*cgl_random(texCoord*13.0+MOD_de)*collisionParams.x;

            bouncyness*=lifeProgress;

            float outwardForce=collisionParams.z;

            vec4 oldVel=texture(texAbsVel,texCoord);
            // vec3 oppositeDir=oldVel.xyz*-vec3(1.0+(MOD_de*2.0));
            vec3 oppositeDir=oldVel.xyz*-1.0;

            vec3 r=normalize((vec3( cgl_random(texCoord),cgl_random(texCoord*200.0),cgl_random(texCoord*10.0) )-0.5)*2.0)*collisionParams.y;


            if(MOD_de>0.5)
            {
                col.xyz+=1110000.0;
                col.a=0.0;
            }
            else
            col.xyz+=((oppositeDir*(bouncyness) + (pos.xyz-areaPos) * outwardForce)+r) * finalStrength;
        }

    #endif


    outColor0=col;
    outColor1=collisionCol;
    outColor2=col;
    outColor3=col;
}



//