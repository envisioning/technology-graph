

https://matduggan.com/how-does-facetime-work/

How does FaceTime Work?
AUGUST 04, 2021
As an ex-pat living in Denmark, I use FaceTime audio a lot. Not only is it simple to use and reliable, but the sound quality is incredible. For those of you old enough to remember landlines, it reminds me of those but if you had a good headset. When we all switched to cell service audio quality took a huge hit and with modern VoIP home phones the problem hasn't gotten better. So when my mom and I chat over FaceTime Audio and the quality is so good it is like she is in the room with me, it really stands out compared to my many other phone calls in the course of a week.

So how does Apple do this? As someone who has worked as a systems administrator for their entire career, the technical challenges are kind of immense when you think about them. We need to establish a connection between two devices through various levels of networking abstraction, both at the ISP level and home level. This connection needs to be secure, reliable enough to maintain a conversation and also low bandwidth enough to be feasible given modern cellular data limits and home internet data caps. All of this needs to run on a device with a very impressive CPU but limited battery capacity.

What do we know about FaceTime?

A lot of our best information for how FaceTime worked (past tense is important here) is from interested parties around the time the feature was announced, so around the 2010 timeframe. During this period there was a lot of good packet capture work done by interested parties and we got a sense for how the protocol functioned. For those who have worked in VoIP technologies in their career, it's going to look pretty similar to what you may have seen before (with some Apple twists). Here were the steps to a FaceTime call around 2010:

A TCP connection over port 5223 is established with an Apple server. We know that 5223 is used by a lot of things, but for Apple its used for their push notification services. Interestingly, it is ALSO used for XMPP connections, which will come up later.
UDP traffic between the iOS device and Apple servers on ports 16385 and 16386. These ports might be familiar to those of you who have worked with firewalls. These are ports associated with audio and video RTP, which makes sense. RTP, or real-time transport protocol was designed to facilitate video and audio communications over the internet with low latency.
RTP relies on something else to establish a session and in Apple's case it appears to rely on XMPP. This XMPP connection relies on a client certificate on the device issued by Apple. This is why non-iOS devices cannot use FaceTime, even if they could reverse engineer the connection they don't have the certificate.
Apple uses ICE, STUN and TURN to negotiate a way for these two devices to communicate directly with each other. These are common tools used to negotiate peer to peer connections between NAT so that devices without public IP addresses can still talk to each other.
The device itself is identified by registering either a phone number or email address with Apple's server. This, along with STUN information, is how Apple knows how to connect the two devices. STUN, or Session Traversal Utilities for NAT is when a device reaches out to a publically available server and the server determines how this client can be reached.
At the end of all of this negotiation and network traversal, a SIP INVITE message is sent. This has the name of the person along with the bandwidth requirements and call parameters.
Once the call is established there are a series of SIP MESSAGE packets that are likely used to authenticate the devices. Then the actual connection is established and FaceTimes protocols take over using the UDP ports discussed before.
Finally the call is terminated using the SIP protocol when it is concluded. The assumption I'm making is that for FaceTime audio vs video the difference is minor, the primary distinction being that the codec used for audio, AAC-ELD. There is nothing magical about Apple using this codec but it is widely seen as an excellent choice.
That was how the process worked. But we know that in the later years Apple changed FaceTime, adding more functionality and presumably more capacity. According to their port requirements these are the ones required now. I've added what I suspect they are used for.

Video and Audio Quality

A video FaceTime call is 4 media streams in each call. The audio is AAC-ELD as described above, with an observed 68 kbps in each direction (or about 136 kbps give or take) consumed. Video is H.264 and varies quite a bit in quality depending presumably on whatever bandwidth calculations were passed through SIP. We know that SIP has allowances for H.264 information about total consumed bandwidth, although the specifics of how FaceTime does on-the-fly calculations for what capacity is available to a consumer is still unknown to me.

You can observe this behavior by switching from cellular to wifi for video call, where often video compression is visible during the switch (but interestingly the call doesn't drop, a testament to effective network interface handoff inside of iOS). However with audio calls, this behavior is not replicated, where the call either maintaining roughly the same quality or dropping entirely, suggesting less flexibility (which makes sense given the much lower bandwidth requirements).

So does FaceTime still work like this?

I think a lot of it is still true, but wasn't entirely sure if the XMPP component is still there. However after more reading I believe this is still how it works and indeed how a lot of how Apple's iOS infrastructure works. While Apple doesn't have a lot of documentation available about the internals for FaceTime, one that stood out to me was the security document. You can find that document here.

FaceTime is Apple’s video and audio calling service. Like iMessage, FaceTime calls use the Apple Push Notification service (APNs) to establish an initial connection to the user’s registered devices. The audio/video contents of FaceTime calls are protected by end-to-end encryption, so no one but the sender and receiver can access them. Apple can’t decrypt the data.

So we know that port 5223 (TCP) is used by both Apple's push notification service and also XMPP over SSL. We know from older packet dumps that Apple used to used 5223 to establish a connection to their own Jabber servers as the initial starting point of the entire process. My suspicion here is that Apple's push notifications work similar to a normal XMPP pubsub setup.

Apple kind of says as much in their docs here.
This is interesting because it suggests the underlying technology for a lot of Apple's backend is XMPP, surprising because for most of us XMPP is thought of as an older, less used technology. As discussed later I'm not sure if this is XMPP or just uses the same port. Alright so messages are exchanged, but how about the key sharing? These communications are encrypted, but I'm not uploading or sharing public keys (nor do I seem to have any sort of access to said keys).

Keys? I'm lost, I thought we were talking about calls

One of Apple's big selling points is security and iMessage became famous for being an encrypted text message exchange. Traditional SMS was not encrypted and nor were a lot of (most) text based communication, including email. Encryption is computationally expensive and wasn't seen as a high priority until Apple really made it a large part of the conversation for text communication. But why hasn't encryption been a bigger part of the consumer computer ecosystem?

In short: because managing keys sucks ass. If I want to send an encrypted message to you I need to first know your public key. Then I can encrypt the body of a message and you can decrypt it. Traditionally this process is super manual and frankly, pretty shitty.


Credit: Protonmail
So Apple must have some way of generating the keys (presumably on device) and then sharing the public keys. They in fact do, a service called IDS or Apple Identity Service. This is what links up your phone number or email address to the public key for that device.

Apple has a nice little diagram explaining the flow:


As far as I can tell the process is much the same for FaceTime calls as it is for iMessage but with some nuance for the audio/video channels. The certificates are used to establish a shared secret and the actual media is streamed over SRTP.


Not exactly the same but still gets the point across
Someone at Apple read the SSL book

Alright so SIP itself has a mechanism for how to handle encryption, but FaceTime and iMessage work on devices going all the way back to the iPhone 4. So the principal makes sense but then I don't understand why we don't see tons of iMessage clones for Android. If there are billions of Apple devices floating around and most of this relies on local client-side negotiation isn't there a way to fake it?

Alright so this is where it gets a bit strange. So there's a defined way of sending client certificates as outlined in RFC 5246. It appears Apple used to do this but they have changed their process. Now its sent through the application, along with a public token, a nonce and a signature. We're gonna focus on the token and the certificate for a moment.

Token

256-bit binary string
NSLog(@"%@", deviceToken);
// Prints "<965b251c 6cb1926d e3cb366f dfb16ddd e6b9086a 8a3cac9e 5f857679 376eab7C>"
Example
Certificate

Generated on device APN activation
Certificate request sent to albert.apple.com
Uses two TLS extensions, APLN and Server name
So why don't I have a bunch of great Android apps able to send this stuff?

As near as I can tell, the primary issue is two-fold. First the protocol to establish the connection isn't standard. Apple uses APLN to handle the negotiation and the client uses a protocol apns-pack-v1 to handle this. So if you wanted to write your own application to interface with Apple's servers, you would first need to get the x509 client certificate (which seems to be generated at the time of activation). You would then need to be able to establish a connection to the server using APLN passing server name, which I don't know if Android supports. You also can't just generate this one-time, as Apple only allows each device one connection. So if you made an app using values taken from a real Mac or iOS device, I think it would just cause the actual Apple device to drop. If your Mac connected, then the fake device would drop.

But how do Hackintoshes work? For those that don't know, these are normal x86 computers running MacOS. Presumably they would have the required extensions to establish these connections and would also be able to generate the required certificates. This is where it gets a little strange. It appears the Macs serial number is a crucial part of how this process functions, presumably passing some check on Apple's side to figure out "should this device be allowed to initiate a connection".

The way to do this is by generating fake Mac serial numbers as outlined here. The process seems pretty fraught, relying on a couple of factors. First the Apple ID seems to need to be activated through some other device and apparently age of the ID matters. This is likely some sort of weight system to keep the process from getting flooded with fake requests. However it seems before Apple completes the registration process it looks at the plist of the device and attempts to determine "is this a real Apple device".

Apple device serial numbers are not random values though, they are actually a pretty interesting data format that packs in a lot of info. Presumably this was done to make service easier, allowing the AppleCare website and Apple Stores a way to very quickly determine model and age without having to check with some "master Apple serial number server". You can check out the old Apple serial number format here: link.

This ability to brute force new serial numbers is, I suspect, behind the decision by Apple to change the format of the serial number. By switching from a value that can be generated to a totally random value that varies in length, I assume Apple will be able to say with a much higher degree of certainty that "yes this is a MacBook Pro with x serial number" by doing a lookup on an internal database. This would make generating fake serial numbers for these generations of devices virtually impossible, since you would need to get incredibly lucky with both model, MAC address information, logic board ID and serial number.

How secure is all this?

It's as secure as Apple, for all the good and the bad that suggests. Apple is entirely in control of enrollment, token generation, certificate verification and exchange along with the TLS handshake process. The inability for users to provide their own keys for encryption isn't surprising (this is Apple and uploading public keys for users doesn't seem on-brand for them), but I was surprised that there isn't any way for me to display a users key. This would seem like a logical safeguard against man in the middle attacks.

So if Apple wanted to enroll another email address and associate it with an Apple ID and allow it to receive the APN notifications for FaceTime/receive a call, there isn't anything I can see that would stop them from doing that. I'm not suggesting they do or would, simply that it seems technically feasible (since we already know multiple devices receive a FaceTime call at the same time and the enrollment of a new target for a notification depends more on the particular URI for that piece of the Apple ID be it phone number or email address).

So is this all XMPP or not?

I'm not entirely sure. The port is the same and there are some similarities in terms of message subscription, but the large amount of modification to handle the actual transfer of messages tells me if this is XMPP behind the scenes now, it has been heavily modified. I suspect the original design may have been something closer to stock but over the years Apple has made substantial changes to how the secret sauce all works.

To me it still looks a lot like how I would expect this to function, with a massive distributed message queue. You connect to a random APN server, rand(0,255)-courier.push.apple.com, initiate TLS handshake and then messages are pushed to your device as identified by your token. Presumably at Apple's scale of billions of messages flowing at all times, the process is more complicated on the back end, but I suspect a lot of the concepts are similar.

Conclusion

FaceTime is a great service that seems to rely on a very well understood and battle-tested part of the Apple ecosystem, which is their push notification service along with their Apple ID registration service. This process, which is also used by non-Apple applications to receive notifications, allows individual devices to quickly negotiate a client certificate, initiate a secure connection, use normal networking protocols to allow Apple to assist them with bypassing NAT and then establishes a connection between devices using standard SIP protocols. The quality is the result of Apple licensing good codecs and making devices capable of taking advantage of those codecs.

FaceTime and iMessage are linked together along with the rest of the Apple ID services, allowing users to register a phone number or email address as a unique destination.

Still a lot we don't know

I am confident a lot of this is wrong or out of date. It is difficult to get more information about this process, even with running some commands locally. I would love any additional information folks would be willing to share or to point me towards articles or documents I should read.

